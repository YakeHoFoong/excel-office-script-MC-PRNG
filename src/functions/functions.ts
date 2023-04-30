﻿// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { SeedSequence32 } from "../SeedSequence32.js";

import { PCG64DXSM } from "../PCG64DXSM.js";

import { JobSpec, JobResult } from "./functions-worker.js";

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
        simInfo.result = jobResult.result;
        // now close all the promises, if any
        const isError: boolean = typeof jobResult.result == "string";
        for (const p of simInfo.promises) {
          if (isError) p.reject(new Error(jobResult.result as string));
          else p.resolve(jobResult.result);
        }
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
  result: number[][] | string;
  isResultReady: boolean;
  readonly promises: CalcPromise[];
  constructor() {
    this.promises = new Array<CalcPromise>(0);
    this.result = "";
    this.isResultReady = false;
  }
}

interface CalcPromise {
  resolve: (a: number[][] | string) => void;
  reject: (a: Error) => void;
}

/**
 * Testing.
 * @customfunction
 * @requiresAddress
 * @cancelable
 * @param seed Seed for the random number generator
 * @param streamNumber The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams: The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows Number of rows of output
 * @param numColumns Number of columns of output
 * @param invocation Custom function handler
 * @returns A promise that resolves to a dynamic array with the requested random numbers or an error message string.
 */
export async function testRandomStandardNormal(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][] | string> {
  if (!Number.isInteger(numStreams) || numStreams < 1)
    return "Parameter numStreams must be a whole number.";
  if (!Number.isInteger(streamNumber) || streamNumber < 1)
    return "Parameter streamNumber must be a whole number.";
  if (streamNumber > numStreams) return "Parameter streamNumber must be no larger than parameter numStreams.";
  if (!Number.isInteger(numRows) || numRows < 1) return "Parameter numRows must be a whole number.";
  if (!Number.isInteger(numColumns) || numColumns < 1)
    return "Parameter numColumns must be a whole number.";

  // convert the seed from 64-bit floating point number to 2 signed 32-bit integers
  // using DataView class so that this is platform-independent, i.e., do not rely on system's endianness
  const dv64bits = new DataView(new ArrayBuffer(8));
  dv64bits.setFloat64(0, seed);
  const entropy = new Int32Array([dv64bits.getInt32(0), dv64bits.getInt32(4)]);

  // now create the string keys for the 2 maps
  // we need to use strings because JavaScript does not have built-in support for tuples as keys
  const batchKey = [
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
    if (!batchInfo.mapSimNumToSimInfo.has(futureStreamNum)) addSimCalc(futureStreamNum);
    i++;
  }

  // run a clean up of the pre-calc history
  const maxSave: number = g_numWorkers * 3; // subjective choice
  for (const k of batchInfo.mapSimNumToSimInfo.keys()) {
    if (batchInfo.mapSimNumToSimInfo.size <= maxSave) break;
    if (batchInfo.mapSimNumToSimInfo.get(k)?.promises.length == 0) batchInfo.mapSimNumToSimInfo.delete(k);
  }

  // this is needed for the user cancellation below
  let myPromise: CalcPromise;

  invocation.onCanceled = () => {
    const simInfo: SimInfo | undefined = batchInfo.mapSimNumToSimInfo.get(streamNumber);
    if (simInfo) {
      let i = 0;
      while (i < simInfo.promises.length) {
        if (simInfo.promises[i] == myPromise) delete simInfo.promises[i];
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
 * @param first First number
 * @param second Second number
 * @returns The sum of the two numbers.
 */
export function add(first: number, second: number): number {
  return first + second;
}

/**
 * Displays the current time once a second.
 * @customfunction
 * @param invocation Custom function handler
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
 * @param incrementBy Amount to increment
 * @param invocation Custom function handler
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
 * @param message String to write.
 * @returns String to write.
 */
export function logMessage(message: string): string {
  console.log(message);

  return message;
}
