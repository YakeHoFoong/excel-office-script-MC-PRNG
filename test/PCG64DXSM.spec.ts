// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {
    SeedSequence32
} from "../src/SeedSequence32.js";

import {
    Uint64
} from "../src/LongIntMaths.js";

import {
    PCG64DXSM
} from "../src/PCG64DXSM.js";

import {assert} from 'chai';
import "mocha";

describe("PCG64 DXSM Pseudorandom Number Generator - Raw Random", function (): void {

    describe("No spawning children and generate raw", function (): void {
        it("No spawning children and generate raw Test 1", function (done): void {

            const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
            const mySeedSequence: SeedSequence32 = new SeedSequence32(TEST_ENTROPY, 4);
            const myPCG64: PCG64DXSM = new PCG64DXSM(mySeedSequence);

            const num1: Uint64 = new Uint64();
            const num2: Uint64 = new Uint64();
            myPCG64.nextUint64(num1);
            myPCG64.nextUint64(num2);

            const actualResults: bigint[] = [num1.toBigInt(), num2.toBigInt()];
            const expectedResult: bigint[] = [0xa8e29346fd7e8508n, 0x392b540515735b49n];

            assert.deepEqual(actualResults, expectedResult);
            done();
        });
    });

    describe("Spawn children and generate raw", function (): void {
        it("Spawn children and generate raw Test 1", function (done): void {

            const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
            const mySeedSequence: SeedSequence32 = new SeedSequence32(TEST_ENTROPY, 4);
            const seqs: SeedSequence32[] = mySeedSequence.spawn(3);

            const actualResults: bigint[][] = [];
            for (const s of seqs) {
                const myPCG64: PCG64DXSM = new PCG64DXSM(s);

                const num1: Uint64 = new Uint64();
                const num2: Uint64 = new Uint64();
                myPCG64.nextUint64(num1);
                myPCG64.nextUint64(num2);

                const actualResult: bigint[] = [num1.toBigInt(), num2.toBigInt()];

                actualResults.push(actualResult);
            }

            const expectedResult: bigint[][] = [
                [0x43a8befedb067be3n, 0x4bcb74296228d8een],
                [0xa6a9d55a97b3df9en, 0x48bb3e952dfe8088n],
                [0x246c3affb89e944n, 0xe94461a8a3b4445bn],
            ];
            assert.deepEqual(actualResults, expectedResult);
            done();
        });
    });

});
