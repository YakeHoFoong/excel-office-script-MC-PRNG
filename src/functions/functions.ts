// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {
  RandomDistributions
} from "../RandomDistributions.js";

import {
  SeedSequence32
} from "../SeedSequence32.js";

import {
  PCG64DXSM
} from "../PCG64DXSM.js";


/**
 * Get text values that spill down.
 * @customfunction
 * @returns {string[][]} A dynamic array with multiple results.
 */
export function spillDown() {
  return [['first'], ['second'], ['third']];
}

/**
 * Get text values that spill down.
 * @customfunction
 * @returns {number[][]} A dynamic array with multiple results.
 */
export function spillDownNum() {
  return [[3], [4], [5]];
}


/**
 * Testing.
 * @customfunction testRandomStandardNormal
 * @requiresAddress
 * @param seed Seed for the random number generator
 * @param numRows Number of rows of output
 * @param numColumns Number of columns of output
 * @param invocation Custom function handler
 * @returns A promise that resolves to a dynamic array with the requested random numbers.
 */
export function testRandomStandardNormal(seed: number,
                                         numRows: number,
                                         numColumns: number,
                                         invocation: CustomFunctions.CancelableInvocation): string | undefined  {
  // let result = 0;
  //number[][]
  const mySeq = new SeedSequence32(new Int32Array([seed]), 4);
  const myBitGen = new PCG64DXSM(mySeq);
  const myDist = new RandomDistributions(myBitGen);

  const result: number[][] = new Array<number[]>(numRows);

  //return [[2, 3], [4, 5]];
  return invocation.address;

  for (let r= 0; r < numRows; r++)  {
    result[r] = new Array<number>(numColumns);
    for (let c = 0; c < numColumns; c++)  {
      result[r][c] = myDist.randomStandardNormal();
    }
  }
  //const myWorker = new Worker(new URL("./functions-worker.js", import.meta.url));

  //return result;

  //invocation.onCanceled = () => {
  //};
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
