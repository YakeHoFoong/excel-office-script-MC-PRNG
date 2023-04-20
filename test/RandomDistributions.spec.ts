// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {
    SeedSequence32,
    ISeedSequence32Config,
    seedSequence32ConfigDefaults
} from "../src/SeedSequence32.js";

import {
    PCG64DXSM
} from "../src/PCG64DXSM.js";

import {
    RandomDistributions
} from "../src/RandomDistributions.js";


import {assert} from 'chai';
import "mocha";

describe("Random Distributions using PCG64 DXSM bits generator", function (): void {

    describe("Spawn children and generate unit uniform double", function (): void {
        it("Spawn children and generate unit uniform double Test 1", function (done): void {

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
                const randomDist: RandomDistributions = new RandomDistributions(myPCG64);
                const actualResult: number[] = [randomDist.randomUnit(), randomDist.randomUnit()];
                actualResults.push(actualResult);
            }

            const expectedResult: number[][] = [
                [0.26429361078319313, 0.2960732079538134],
                [0.6510289522336302, 0.2841071237762609],
                [0.008892279114241952, 0.9111996685712294],
            ];
            assert.deepEqual(actualResults, expectedResult);
            done();
        });
    });

});
