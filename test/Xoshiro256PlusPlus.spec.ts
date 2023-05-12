// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
// Expected values are from the C file

import { SeedSequence32 } from "../src/SeedSequence32.js";

import { Uint64 } from "../src/LongIntMaths.js";

import { Xoshiro256PlusPlus } from "../src/Xoshiro256PlusPlus.js";

import { assert } from "chai";
import { describe, it } from "mocha";

describe("Xoshiro256++ Pseudorandom Number Generator - Raw Random", function (): void {
  describe("No spawning children and generate raw", function (): void {
    it("No spawning children and generate raw Test 1", function (done): void {
      const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
      const mySeedSequence: SeedSequence32 = new SeedSequence32({
        entropy: TEST_ENTROPY,
        poolSize: 4,
        CONFIG_TYPE: "PARENT",
      });
      const myXoshi: Xoshiro256PlusPlus = new Xoshiro256PlusPlus(
        mySeedSequence.generateState(Xoshiro256PlusPlus.SEED_SEQ_NUM_WORDS)
      );

      const num1: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      myXoshi.nextUint64(num1);
      myXoshi.nextUint64(num2);

      const actualResults: bigint[] = [num1.toBigInt(), num2.toBigInt()];
      const expectedResult: bigint[] = [0xf18ed5e91ba47a44n, 0xd78c4a632a6cca27n];

      assert.deepEqual(actualResults, expectedResult);
      done();
    });
  });

  describe("Spawn children and generate raw", function (): void {
    it("Spawn children and generate raw Test 1", function (done): void {
      const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
      const mySeedSequence: SeedSequence32 = new SeedSequence32({
        entropy: TEST_ENTROPY,
        poolSize: 4,
        CONFIG_TYPE: "PARENT",
      });
      const fn: (a: number) => Int32Array = Xoshiro256PlusPlus.createStreamsFunction(mySeedSequence);

      const actualResults: bigint[][] = [];
      for (let c = 0; c < 3; c++) {
        const states: Int32Array = fn(c);
        const myXoshi: Xoshiro256PlusPlus = new Xoshiro256PlusPlus(states);

        const num1: Uint64 = new Uint64();
        const num2: Uint64 = new Uint64();
        myXoshi.nextUint64(num1);
        myXoshi.nextUint64(num2);

        const actualResult: bigint[] = [num1.toBigInt(), num2.toBigInt()];

        actualResults.push(actualResult);
      }

      const expectedResult: bigint[][] = [
        [0xf18ed5e91ba47a44n, 0xd78c4a632a6cca27n],
        [0xdd34a392717b1eeen, 0x8a303c0430aeea1n],
        [0x8898d64a0e85e9fbn, 0x24c3050d62415ca7n],
      ];
      assert.deepEqual(actualResults, expectedResult);
      done();
    });
  });
});
