// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
import { SeedSequence32 } from "../src/SeedSequence32.js";
import { assert } from 'chai';
import "mocha";
function int32toBigInt(x: number): bigint {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit: bigint = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}


describe("Seed Sequence 32", function (): void {
    describe("Spawn children and generate state", function (): void {
        it("Spawn and generate Test 1", function (done): void {
            const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);

            const mySeedSequence: SeedSequence32 = new SeedSequence32(TEST_ENTROPY, new Int32Array(0), 4, 0);
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