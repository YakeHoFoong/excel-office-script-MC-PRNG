// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {
    SeedSequence32,
    ISeedSequence32Config,
    seedSequence32ConfigDefaults
} from "../src/SeedSequence32.js";

import {
    int32toBigInt,
} from "../src/LongIntMaths.js";

import { assert } from 'chai';
import "mocha";

describe("Seed Sequence 32", function (): void {
    describe("Spawn children and generate state", function (): void {
        it("Spawn and generate Test 1", function (done): void {
            const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
            const config: ISeedSequence32Config = {
                ...seedSequence32ConfigDefaults,
                entropy: TEST_ENTROPY
            };
            const mySeedSequence: SeedSequence32 = new SeedSequence32(config);
            const seqs: SeedSequence32[] = mySeedSequence.spawn(3);

            const actualResults: bigint[][] = [];
            for (const s of seqs) {
                const actualResult: bigint[] = [];
                let xs: Int32Array = s.generateState(4);
                xs.forEach((item: number): void => {
                    actualResult.push(int32toBigInt(item));
                });
                actualResults.push(actualResult);
            }

            const expectedResult: bigint[][] = [
            [0x87490501n, 0x549bfa4fn, 0x87b9ce49n, 0xef69fa41n],
            [0x78c07f4bn, 0x49985ccan, 0xffb30f8cn, 0xe4c76c3bn],
            [0x740fc0d5n, 0xa0e59e89n, 0xb35cb52n, 0xe4f18a1dn]
                ];
            // expect(actualResults).to.equal(expectedResult);
            assert.deepEqual(actualResults, expectedResult);
            done();
        });
    });
});
