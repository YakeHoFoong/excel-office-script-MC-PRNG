// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {
    SeedSequence32,
    ISeedSequence32Config,
    seedSequence32ConfigDefaults
} from "../src/SeedSequence32.js";

import {
    NumberPair
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
            const config: ISeedSequence32Config = {
                ...seedSequence32ConfigDefaults,
                entropy: TEST_ENTROPY
            };
            const mySeedSequence: SeedSequence32 = new SeedSequence32(config);
            const myPCG64: PCG64DXSM = new PCG64DXSM(mySeedSequence);

            const pair1: NumberPair = {num1: 0, num2: 0};
            myPCG64.next64(pair1);
            const pair2: NumberPair = {num1: 0, num2: 0};
            myPCG64.next64(pair2);

            const actualResults: number[] = [pair1.num1, pair1.num2, pair2.num1, pair2.num2];
            const expectedResult: number[] = [0xfd7e8508, 0xa8e29346, 0x15735b49, 0x392b5405];

            assert.deepEqual(actualResults, expectedResult);
            done();
        });
    });

    describe("Spawn children and generate raw", function (): void {
        it("Spawn children and generate raw Test 1", function (done): void {

            const TEST_ENTROPY: Int32Array = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
            const config: ISeedSequence32Config = {
                ...seedSequence32ConfigDefaults,
                entropy: TEST_ENTROPY
            };
            const mySeedSequence: SeedSequence32 = new SeedSequence32(config);
            const seqs: SeedSequence32[] = mySeedSequence.spawn(3);

            const actualResults: number[][] = [];
            for (const s of seqs) {
                const myPCG64: PCG64DXSM = new PCG64DXSM(s);
                const pair1: NumberPair = {num1: 0, num2: 0};
                myPCG64.next64(pair1);
                const pair2: NumberPair = {num1: 0, num2: 0};
                myPCG64.next64(pair2);
                const actualResult: number[] = [pair1.num1, pair1.num2, pair2.num1, pair2.num2];
                actualResults.push(actualResult);
            }

            const expectedResult: number[][] = [
                [0xdb067be3, 0x43a8befe, 0x6228d8ee, 0x4bcb7429],
                [0x97b3df9e, 0xa6a9d55a, 0x2dfe8088, 0x48bb3e95],
                [0xfb89e944, 0x246c3af, 0xa3b4445b, 0xe94461a8],
            ];
            assert.deepEqual(actualResults, expectedResult);
            done();
        });
    });

});
