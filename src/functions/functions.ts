// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { SeedSequence32 } from "../SeedSequence32.js";

import { PCG64DXSM } from "../PCG64DXSM.js";
import { Xoshiro256PlusPlus } from "../Xoshiro256PlusPlus.js";

import { BitGeneratorEnum, JobResult, JobSpec, RandomDistributionEnum } from "./functions-worker.js";
import { showMessageInTaskpane } from "../taskpane/taskpane.js";

/**
 * A set of parameters that uniquely determines a {@link StreamSet} object.
 */
interface StreamSetParams {
  bitGenType: BitGeneratorEnum;
  distribution: RandomDistributionEnum;
  entropy: Int32Array;
  numStreams: number;
  numRows: number;
  numColumns: number;
}

class StreamSet {
  // eslint-disable-next-line no-undef
  private static readonly numLogicalCores: number = window.navigator.hardwareConcurrency;
  private static readonly numWorkers: number = Math.ceil(StreamSet.numLogicalCores * 0.5); // subjective choice
  /**
   * We share the Web workers per Excel workbook.
   */
  private static readonly webWorkers: Array<Worker | undefined> = new Array<Worker>(StreamSet.numWorkers);

  /**
   * {@link Map} of string representation of {@link StreamSetParams} -\> {@link StreamSet} object. The string
   * representation is calculated by the static method {@link StreamSet.paramsToString} and for each {@link StreamSet}
   * object, stored in the instance readonly variable {@link StreamSet.streamSetKey}.
   * Each {@link StreamSet} object contains a {@link StreamSet.fnStreamNumToSeedState} function and a
   * {@link StreamSet.mapStreamNumToStreamCalc} map.
   */
  private static readonly mapPreCalc: Map<string, StreamSet> = new Map<string, StreamSet>();
  /**
   * A function that takes a stream number and returns the Seed State (Int32Array) for that stream.
   */
  private readonly fnStreamNumToSeedState: (a: number) => Int32Array;
  /**
   * {@link Map} of a stream number -\> {@link StreamCalc} object.
   */
  private readonly mapStreamNumToStreamCalc: Map<number, StreamCalc>;

  private lastAccessed: number;
  /**
   * A string representation of {@link StreamSet.params}, which is used as the key in the static
   * member {@link StreamSet.mapPreCalc}. Calculated by the static method {@link StreamSet.paramsToString}.
   */
  private readonly streamSetKey: string;
  private readonly params: StreamSetParams;

  /**
   * Given a {@link StreamSet.params} interface, calculate its string representation to be used as a key for the static
   * member {@link StreamSet.mapPreCalc}. This is because TypeScript maps do not support complex objects as key.
   */
  private static paramsToString(params: StreamSetParams): string {
    return [
      params.bitGenType.toString(),
      params.distribution.toString(),
      Array.from(params.entropy)
        .map((x) => x.toString())
        .join(";"),
      params.numStreams.toString(),
      params.numRows.toString(),
      params.numColumns.toString(),
    ].join(";");
  }

  /**
   * A factory static method. Note that no duplicate object is created even if there are duplicate formulae in the
   * Excel spreadsheet, as we check by the key.
   */
  static getOrCreate(params: StreamSetParams): StreamSet {
    const streamSetKey: string = StreamSet.paramsToString(params);
    return StreamSet.mapPreCalc.get(streamSetKey) ?? new StreamSet(params); // the constructor will add itself to the static map
  }

  /**
   * The function to process messages (results) from workers is defined inside here.
   */
  private static getOrCreateWebWorker(streamNumber: number): Worker {
    const index: number = (streamNumber - 1) % StreamSet.numWorkers;
    const thisWorker: Worker | undefined = StreamSet.webWorkers[index];
    if (thisWorker) return thisWorker;

    // create a new web worker
    const webWorker: Worker = new Worker(new URL("./functions-worker.js", import.meta.url));
    webWorker.addEventListener("message", (event) => {
      const jobResult: JobResult = event.data;

      const streamSet: StreamSet | undefined = StreamSet.mapPreCalc.get(jobResult.streamSetKey);
      if (streamSet) {
        const streamCalc: StreamCalc | undefined = streamSet.mapStreamNumToStreamCalc.get(jobResult.streamNumber);
        if (streamCalc) {
          // save results
          streamCalc.isResultReady = true;
          const numCols = jobResult.numColumns;
          const numBytesPerRow = numCols * Float64Array.BYTES_PER_ELEMENT;
          let i = 0;
          streamCalc.result = new Array<number[]>(jobResult.numRows);
          for (let r = 0; r < jobResult.numRows; r++, i += numBytesPerRow)
            streamCalc.result[r] = Array.from(new Float64Array(jobResult.result, i, numCols));
          // now close all the promises, if any
          for (const p of streamCalc.promises) p.resolve(streamCalc.result);
          // now clear all promises
          streamCalc.promises.length = 0;
        } else throw Error("Worker results returned for unknown stream number of job.");
      } else throw Error("Worker results returned for unknown stream set of job.");
    });

    StreamSet.webWorkers[index] = webWorker;
    return webWorker;
  }

  /**
   * @param params - a function that takes a stream number and
   * returns the initial state for that given stream number. That state could
   * be generated by spawning of children using {@link SeedSequence32.spawn}
   * or by a jump in {@link Xoshiro256PlusPlus.createStreamsFunction}. Note that
   * for {@link PCG64DXSM}, no jump version is implemented in this add-in tool,
   * consistent with Numpy.   * @returns None.
   */
  private constructor(params: StreamSetParams) {
    this.params = params;
    this.streamSetKey = StreamSet.paramsToString(params);
    const seq: SeedSequence32 = new SeedSequence32({ entropy: params.entropy, poolSize: 4, CONFIG_TYPE: "PARENT" });
    switch (params.bitGenType) {
      case BitGeneratorEnum.PCG64DXSM:
        this.fnStreamNumToSeedState = (sNum: number) =>
          seq.spawn(params.numStreams)(sNum).generateState(PCG64DXSM.SEED_SEQ_NUM_WORDS);
        break;
      case BitGeneratorEnum.Xoshiro256PlusPlus:
        this.fnStreamNumToSeedState = Xoshiro256PlusPlus.createStreamsFunction(seq);
        break;
      default:
        throw Error("Unknown bit generator type requested.");
    }
    this.mapStreamNumToStreamCalc = new Map<number, StreamCalc>();
    this.lastAccessed = Date.now(); // milliseconds since start of 1970
    // save this object to the shared (static element) map
    StreamSet.mapPreCalc.set(this.streamSetKey, this);
  }
  /**
   * Performs memory cleanup of unused pre-calculated results or saved calculation results.
   * @returns None.
   */
  private cleanUp(): void {
    // run a cleanup of the pre-calc history
    const maxSave: number = StreamSet.numWorkers * 3; // subjective choice
    // note that below, the map elements are from oldest to newest
    for (const [k, v] of this.mapStreamNumToStreamCalc) {
      if (this.mapStreamNumToStreamCalc.size <= maxSave) break;
      if (v.promises.length === 0) this.mapStreamNumToStreamCalc.delete(k);
    }
    // kill any "stuck" StreamSet object
    const timeNow: number = Date.now(); // in milliseconds
    for (const ss of StreamSet.mapPreCalc.values()) {
      if (timeNow - ss.lastAccessed > 3600000) ss.cancel("Timed out"); // subjective choice of 1 hour
    }
  }
  /**
   * Starts worker to calculate stream number, if not yet started.
   * @returns {@link StreamCalc} related to that stream number, regardless of whether it has been started or not.
   */
  private startStreamNumCalc(streamNumber: number): StreamCalc {
    const result: StreamCalc | undefined = this.mapStreamNumToStreamCalc.get(streamNumber);
    if (result) return result;
    else {
      const worker: Worker = StreamSet.getOrCreateWebWorker(streamNumber);
      const streamCalc: StreamCalc = new StreamCalc();
      this.mapStreamNumToStreamCalc.set(streamNumber, streamCalc);
      const jobSpec: JobSpec = {
        bitGenType: this.params.bitGenType,
        distribution: this.params.distribution,
        batchKey: this.streamSetKey,
        streamNumber: streamNumber,
        numRows: this.params.numRows,
        numColumns: this.params.numColumns,
        initialState: this.fnStreamNumToSeedState(streamNumber),
      };
      worker.postMessage(jobSpec);
      return streamCalc;
    }
  }
  async calcStreamNum(streamNumber: number): Promise<number[][]> {
    // first record the access time, used for cleanup later
    this.lastAccessed = Date.now();
    // setup pre-calculations for (g_numWorkers - 1) simulation numbers ahead
    let i = 1;
    while (i < StreamSet.numWorkers) {
      const futureStreamNum = streamNumber + i;
      if (futureStreamNum > this.params.numStreams) break;
      this.startStreamNumCalc(futureStreamNum);
      i++;
    }
    // run a cleanup of the pre-calc history
    this.cleanUp();
    // now deal with current requested calculation
    const streamCalc: StreamCalc | undefined = this.mapStreamNumToStreamCalc.get(streamNumber);
    if (streamCalc) {
      if (streamCalc.isResultReady) return streamCalc.result;
      else {
        return new Promise((resolve, reject) => {
          streamCalc.promises.push({ resolve: resolve, reject: reject });
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        const streamCalc: StreamCalc = this.startStreamNumCalc(streamNumber);
        streamCalc.promises.push({ resolve: resolve, reject: reject });
      });
    }
  }
  private cancel(message: string): void {
    for (const sc of this.mapStreamNumToStreamCalc.values()) {
      for (const p of sc.promises) p.reject(Error(message));
      sc.promises.length = 0;
    }
    this.mapStreamNumToStreamCalc.clear();
    StreamSet.mapPreCalc.delete(this.streamSetKey);
  }
  static userCancel(): void {
    // kill all workers for this add-in in this workbook
    for (let i = 0; i < StreamSet.webWorkers.length; i++) {
      const w = StreamSet.webWorkers[i];
      if (w) w.terminate();
      StreamSet.webWorkers[i] = undefined;
    }
    // kill all StreamSet objects
    for (const ss of StreamSet.mapPreCalc.values()) ss.cancel("User cancelled");
  }
}

class StreamCalc {
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
 * @customfunction RANDOM.UNIT.UNIFORM.Xoshiro256PlusPlus
 * @cancelable
 * @helpurl https://www.phattailed.com/Monte-Carlo-excel-add-in/help.html
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
export async function randomUnitUniformXoshiro256PlusPlus(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  return randomNumber(
    BitGeneratorEnum.Xoshiro256PlusPlus,
    RandomDistributionEnum.UnitUniform,
    seed,
    streamNumber,
    numStreams,
    numRows,
    numColumns,
    invocation
  );
}

/**
 * @customfunction RANDOM.STANDARD.NORMAL.Xoshiro256PlusPlus
 * @cancelable
 * @helpurl https://www.phattailed.com/Monte-Carlo-excel-add-in/help.html
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
export async function randomStandardNormalXoshiro256PlusPlus(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  return randomNumber(
    BitGeneratorEnum.Xoshiro256PlusPlus,
    RandomDistributionEnum.StandardNormal,
    seed,
    streamNumber,
    numStreams,
    numRows,
    numColumns,
    invocation
  );
}

/**
 * @customfunction RANDOM.UNIT.UNIFORM.PCG64DXSM
 * @cancelable
 * @helpurl https://www.phattailed.com/Monte-Carlo-excel-add-in/help.html
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
export async function randomUnitUniformPCG64DXSM(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  return randomNumber(
    BitGeneratorEnum.PCG64DXSM,
    RandomDistributionEnum.UnitUniform,
    seed,
    streamNumber,
    numStreams,
    numRows,
    numColumns,
    invocation
  );
}

/**
 * @customfunction RANDOM.STANDARD.NORMAL.PCG64DXSM
 * @cancelable
 * @helpurl https://www.phattailed.com/Monte-Carlo-excel-add-in/help.html
 * @param seed - Seed for the random number generator
 * @param streamNumber - The stream number of current function call, usually the stochastic simulation/scenario/path of the current Excel TABLE loop
 * @param numStreams - The total number of streams, usually the total number of stochastic simulations/scenarios/paths
 * @param numRows - Number of rows of output
 * @param numColumns - Number of columns of output
 * @param invocation - Custom function handler
 * @returns A promise that resolves to a 2D array of numbers with the requested random numbers or rejected with an error message string.
 * *** CAUTION !!! The return type must be Promise<T> and T must not be a union type, otherwise the function will just hang. ***
 */
export async function randomStandardNormalPCG64DXSM(
  seed: number,
  streamNumber: number,
  numStreams: number,
  numRows: number,
  numColumns: number,
  invocation: CustomFunctions.CancelableInvocation
): Promise<number[][]> {
  return randomNumber(
    BitGeneratorEnum.PCG64DXSM,
    RandomDistributionEnum.StandardNormal,
    seed,
    streamNumber,
    numStreams,
    numRows,
    numColumns,
    invocation
  );
}

/**
 * @param bitGenType - The PRNG type, currently only PCG64DXSM and Xoshiro256++ available
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
  bitGenType: BitGeneratorEnum,
  distribution: RandomDistributionEnum,
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

  const batchParams: StreamSetParams = {
    bitGenType: bitGenType,
    distribution: distribution,
    entropy: entropy,
    numStreams: numStreams,
    numRows: numRows,
    numColumns: numColumns,
  };

  // setup the cancel function
  invocation.onCanceled = () => {
    StreamSet.userCancel();
  };

  return StreamSet.getOrCreate(batchParams).calcStreamNum(streamNumber);
}

/**
 * {@link Map} of memoized results: cell address -\> 2D array of numbers.
 * Note that add-ins (and hence this variable) have a single instance per workbook. Also, the cell address
 * string in the invocation parameter of CustomFunctions include the sheet name. Hence, that can be used
 * as a unique key in the {@link Map} object here.
 */
const g_mapMemoization: Map<string, number[][]> = new Map<string, number[][]>();

/**
 * @customfunction MEMOIZE
 * @helpurl https://www.phattailed.com/Monte-Carlo-excel-add-in/help.html
 * @returns A promise containing the values
 * @param store - if FALSE, then save parameter values, else retrieve values from memoization map
 * @param values - saved if parameter store is TRUE, else ignored
 * @param invocation - Custom function handler
 * @requiresAddress
 */
export async function memoize(
  store: boolean,
  values: number[][],
  invocation: CustomFunctions.Invocation
): Promise<number[][]> {
  if (invocation.address === undefined) throw Error("MEMOIZE called with invalid cell address information.");
  else {
    if (store) g_mapMemoization.set(invocation.address, values);
    const results = g_mapMemoization.get(invocation.address);
    if (results === undefined) throw Error("MEMOIZE called to get numbers before storing numbers.");
    else return results;
  }
}

/**
 * @customfunction TASKPANE.MESSAGE
 * @helpurl https://www.phattailed.com/Monte-Carlo-excel-add-in/help.html
 * @returns A promise containing the message
 * @param message - The message to show on the task pane
 * @param invocation - Custom function handler
 * @requiresAddress
 */
export async function taskpaneMessage(message: string, invocation: CustomFunctions.Invocation): Promise<string> {
  showMessageInTaskpane(invocation.address as string, message);
  return message;
}
