// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { SeedSequence32 } from "../SeedSequence32.js";

import { PCG64DXSM } from "../PCG64DXSM.js";

import { JobResult, JobSpec, RandomDistribution } from "./functions-worker.js";

// eslint-disable-next-line no-undef
const g_numLogicalCores: number = window.navigator.hardwareConcurrency;
// set number of workers to half the number of logical cores
const g_numWorkers: number = Math.ceil(g_numLogicalCores * 0.5);
const g_webworkers: Worker[] = new Array<Worker>(g_numWorkers);

/**
 * The function to process messages (results) from workers is defined inside here.
 */
function getOrCreateWebWorker(streamNumber: number): Worker {
  const index = (streamNumber - 1) % g_numWorkers;
  if (g_webworkers[index]) {
    return g_webworkers[index];
  }

  // create a new web worker
  const webWorker: Worker = new Worker(new URL("./functions-worker.js", import.meta.url));
  webWorker.addEventListener("message", function (event) {
    const jobResult: JobResult = event.data;

    const simBatchInfo: SimBatchInfo | undefined = g_mapPreCalc.get(jobResult.batchKey);
    if (simBatchInfo) {
      const simInfo: SimInfo | undefined = simBatchInfo.mapSimNumToSimInfo.get(jobResult.streamNumber);
      if (simInfo) {
        // save results
        simInfo.isResultReady = true;
        const numCols = jobResult.numColumns;
        const numBytesPerRow = numCols * Float64Array.BYTES_PER_ELEMENT;
        let i = 0;
        simInfo.result = new Array<number[]>(jobResult.numRows);
        for (let r = 0; r < jobResult.numRows; r++, i += numBytesPerRow)
          simInfo.result[r] = Array.from(new Float64Array(jobResult.result, i, numCols));
        // now close all the promises, if any
        for (const p of simInfo.promises) p.resolve(simInfo.result);
        // now clear all promises
        simInfo.promises.length = 0;
      } else throw Error("Worker results returned for unknown stream number of job.");
    } else throw Error("Worker results returned for unknown job batch.");
  });

  g_webworkers[index] = webWorker;
  return webWorker;
}

/**
 * Map of string of tuple (seed, total number of simulations, number of rows, number of columns) -\>
 * {@link SimBatchInfo} object, which in turn contains a function that maps the stream number
 * to the {@link SeedSequence32} object for the given stream number,
 * and a map that maps the stream number to the {@link SimInfo} object.
 * The term ***sim*** is used synonymously with ***stream***.
 */
const g_mapPreCalc: Map<string, SimBatchInfo> = new Map<string, SimBatchInfo>();

class SimBatchInfo {
  readonly fnSimNumToSeq: (a: number) => SeedSequence32;
  readonly mapSimNumToSimInfo: Map<number, SimInfo>;
  constructor(fnSimNumToSeq: (a: number) => SeedSequence32) {
    this.fnSimNumToSeq = fnSimNumToSeq;
    this.mapSimNumToSimInfo = new Map();
  }
}

class SimInfo {
  result: number[][];
  isResultReady: boolean;
  readonly promises: CalcPromise[];
  constructor() {
    this.promises = new Array<CalcPromise>(0);
    this.result = [];
    this.isResultReady = false;
  }
}

interface CalcPromise {
  resolve: (a: number[][]) => void;
  reject: (a: Error) => void;
}

/**
 * @customfunction RANDOM.UNIT.UNIFORM
 * @cancelable
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
export async function randomUnitUniform(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  return randomNumber(
    RandomDistribution.UnitUniform,
    seed,
    streamNumber,
    numStreams,
    numRows,
    numColumns,
    invocation
  );
}

/**
 * @customfunction RANDOM.STANDARD.NORMAL
 * @cancelable
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
export async function randomStandardNormal(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  return randomNumber(
    RandomDistribution.StandardNormal,
    seed,
    streamNumber,
    numStreams,
    numRows,
    numColumns,
    invocation
  );
}

/**
 * @param distribution - The random distribution type, currently only Standard Normal and Unit Uniform available
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
async function randomNumber(
  distribution: RandomDistribution,
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  if (!Number.isInteger(numStreams) || numStreams < 1) throw Error("Parameter numStreams must be a whole number.");
  if (!Number.isInteger(streamNumber) || streamNumber < 1)
    throw Error("Parameter streamNumber must be a whole number.");
  if (streamNumber > numStreams) throw Error("Parameter streamNumber must be no larger than parameter numStreams.");
  if (!Number.isInteger(numRows) || numRows < 1) throw Error("Parameter numRows must be a whole number.");
  if (!Number.isInteger(numColumns) || numColumns < 1) throw Error("Parameter numColumns must be a whole number.");

  // convert the seed from 64-bit floating point number to 2 signed 32-bit integers
  // using DataView class so that this is platform-independent, i.e., do not rely on system's endianness
  const dv64bits = new DataView(new ArrayBuffer(8));
  dv64bits.setFloat64(0, seed);
  const entropy = new Int32Array([dv64bits.getInt32(0), dv64bits.getInt32(4)]);

  // now create the string keys for the 2 maps
  // we need to use strings because JavaScript does not have built-in support for tuples as keys
  const batchKey = [
    distribution.toString(),
    entropy[0].toString(),
    entropy[1].toString(),
    numStreams.toString(),
    numRows.toString(),
    numColumns.toString(),
  ].join(";");

  if (!g_mapPreCalc.has(batchKey)) {
    const seq: SeedSequence32 = new SeedSequence32({ entropy: entropy, poolSize: 4, CONFIG_TYPE: "PARENT" });
    const fn: (a: number) => SeedSequence32 = seq.spawn(numStreams);
    g_mapPreCalc.set(batchKey, new SimBatchInfo(fn));
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const batchInfo: SimBatchInfo = g_mapPreCalc.get(batchKey)!;

  // define a local function for adding a simulation number to the calculations
  function addSimCalc(sNum: number, prom?: CalcPromise): void {
    const worker: Worker = getOrCreateWebWorker(sNum);
    const jobSpec: JobSpec = {
      distribution: distribution,
      batchKey: batchKey,
      streamNumber: sNum,
      numRows: numRows,
      numColumns: numColumns,
      seqSeeds: batchInfo.fnSimNumToSeq(sNum).generateState(PCG64DXSM.SEED_SEQ_NUM_WORDS),
    };
    const simInfo: SimInfo = new SimInfo();
    batchInfo.mapSimNumToSimInfo.set(sNum, simInfo);
    if (prom) simInfo.promises.push(prom);
    worker.postMessage(jobSpec);
  }

  // setup pre-calculations for (g_numWorkers - 1) simulation numbers ahead
  let i = 1;
  while (i < g_numWorkers) {
    const futureStreamNum = streamNumber + i;
    if (futureStreamNum > numStreams) break;
    if (!batchInfo.mapSimNumToSimInfo.has(futureStreamNum)) addSimCalc(futureStreamNum);
    i++;
  }

  // run a clean up of the pre-calc history
  const maxSave: number = g_numWorkers * 3; // subjective choice
  for (const [k, v] of batchInfo.mapSimNumToSimInfo) {
    if (batchInfo.mapSimNumToSimInfo.size <= maxSave) break;
    if (v.promises.length === 0) batchInfo.mapSimNumToSimInfo.delete(k);
  }

  // this is needed for the user cancellation below
  let myPromise: CalcPromise;

  invocation.onCanceled = () => {
    const simInfo: SimInfo | undefined = batchInfo.mapSimNumToSimInfo.get(streamNumber);
    if (simInfo) {
      let i = 0;
      while (i < simInfo.promises.length) {
        if (simInfo.promises[i] === myPromise) simInfo.promises.splice(i, 1);
        else i++;
      }
    }
    myPromise.reject(Error("User cancelled"));
    // kill all workers in case user canceled because system is unresponsive
    for (const w of g_webworkers) w.terminate();
  };

  // now deal with current requested calculation
  const simInfo: SimInfo | undefined = batchInfo.mapSimNumToSimInfo.get(streamNumber);
  if (simInfo) {
    if (simInfo.isResultReady) return simInfo.result;
    else {
      return new Promise((resolve, reject) => {
        myPromise = { resolve: resolve, reject: reject };
        simInfo.promises.push(myPromise);
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      myPromise = { resolve: resolve, reject: reject };
      addSimCalc(streamNumber, myPromise);
    });
  }
}

/* global clearInterval, console, CustomFunctions, setInterval */

/**
 * Adds two numbers.
 * @customfunction
 * @param first - First number
 * @param second - Second number
 * @returns The sum of the two numbers.
 */
export function add(first: number, second: number): number {
  return first + second;
}

/**
 * Adds two numbers.
 * @customfunction
 * @param first - First number
 * @param second - Second number
 * @returns The sum of the two numbers.
 */
export async function blah(first: number, second: number): Promise<number[][]> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((resolve) => {
    const result: number[][] = new Array<number[]>(1000);
    for (let r = 0; r < 1000; r++) {
      result[r] = new Array<number>(30);
      for (let c = 0; c < 30; c++) {
        result[r][c] = first + second;
      }
    }
    // eslint-disable-next-line no-undef
    window.setTimeout(() => resolve(result), 3000);
  });
  //return [[first, second], [second, first], [first, first]];
}

/**
 * Displays the current time once a second.
 * @customfunction
 * @param invocation - Custom function handler
 */
export function clock(invocation: CustomFunctions.StreamingInvocation<string>): void {
  const timer = setInterval(() => {
    const time = currentTime();
    invocation.setResult(time);
  }, 1000);

  invocation.onCanceled = () => {
    clearInterval(timer);
  };
}

/**
 * Returns the current time.
 * @returns String with the current time formatted for the current locale.
 */
export function currentTime(): string {
  return new Date().toLocaleTimeString();
}

/**
 * Increments a value once a second.
 * @customfunction
 * @param incrementBy - Amount to increment
 * @param invocation - Custom function handler
 */
export function increment(incrementBy: number, invocation: CustomFunctions.StreamingInvocation<number>): void {
  let result = 0;
  const timer = setInterval(() => {
    result += incrementBy;
    invocation.setResult(result);
  }, 1000);

  invocation.onCanceled = () => {
    clearInterval(timer);
  };
}

/**
 * Writes a message to console.log().
 * @customfunction LOG
 * @param message - String to write.
 * @returns String to write.
 */
export function logMessage(message: string): string {
  console.log(message);

  return message;
}

/**
 * Writes a message to console.log().
 * @customfunction NUMBER.OF.LOGICAL.CORES
 * @param message - String to write.
 * @returns String to write.
 */
export function numLogicalCores(): number {
  return g_numLogicalCores;
}
