// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { SeedSequence32 } from "../src/SeedSequence32.js";

import { int32toNumber } from "../src/LongIntMaths.js";

import { assert } from "chai";
import { describe, it } from "mocha";

describe("Seed Sequence 32", function (): void {
  describe("No spawn and generate state", function (): void {
    it("No spawn and generate state Test 1", function (done): void {
      const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
      const mySeedSequence: SeedSequence32 = new SeedSequence32({
        entropy: TEST_ENTROPY,
        poolSize: 4,
        CONFIG_TYPE: "PARENT",
      });
      const xs: Int32Array = mySeedSequence.generateState(8);
      const actualResult: number[] = [];
      xs.forEach((item: number): void => {
        actualResult.push(int32toNumber(item));
      });
      const expectedResult: number[] = [
        0xf431cc88, 0xb5bb44b2, 0xb2e89874, 0xe3977bac, 0x9d0ba2f2, 0xb18b61e2, 0xf72adfa6, 0x2480e33b,
      ];
      // expect(actualResults).to.equal(expectedResult);
      assert.deepEqual(actualResult, expectedResult);
      done();
    });
  });

  describe("Spawn children and generate state", function (): void {
    it("Spawn and generate Test 1", function (done): void {
      const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
      const mySeedSequence: SeedSequence32 = new SeedSequence32({
        entropy: TEST_ENTROPY,
        poolSize: 4,
        CONFIG_TYPE: "PARENT",
      });
      const seqs = mySeedSequence.spawn(3);

      const actualResults: number[][] = [];
      for (let c = 0; c < 3; c++) {
        const actualResult: number[] = [];
        const xs: Int32Array = seqs(c).generateState(4);
        xs.forEach((item: number): void => {
          actualResult.push(int32toNumber(item));
        });
        actualResults.push(actualResult);
      }

      const expectedResult: number[][] = [
        [0x87490501, 0x549bfa4f, 0x87b9ce49, 0xef69fa41],
        [0x78c07f4b, 0x49985cca, 0xffb30f8c, 0xe4c76c3b],
        [0x740fc0d5, 0xa0e59e89, 0xb35cb52, 0xe4f18a1d],
      ];
      // expect(actualResults).to.equal(expectedResult);
      assert.deepEqual(actualResults, expectedResult);
      done();
    });
  });
});
