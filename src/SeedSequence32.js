// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2015 Melissa E. O'Neill
// SPDX-FileCopyrightText: (c) 2019 NumPy Developers
// SPDX-License-Identifier: MIT
/**
 * This is a TypeScript port of almost all of the contents
 * of the following part of the Numpy library:
 * https://github.com/numpy/numpy/blob/main/numpy/random/bit_generator.pyx
 *
 * This module contains the calculations to produce high-quality seeds
 * based on inputs of low-quality seeds.
 * @packageDocumentation
 */
export { SeedSequence32, seedSequence32ConfigDefaults };
const DEFAULT_POOL_SIZE = 4;
const XSHIFT = 16 | 0;
function mix(x, y) {
    const MIX_MULT_L = 0xca01f9dd | 0;
    const MIX_MULT_R = 0x4973f715 | 0;
    x |= 0;
    y |= 0;
    const result = ((Math.imul(MIX_MULT_L, x) | 0)
        - (Math.imul(MIX_MULT_R, y) | 0)) | 0;
    return result ^ (result >>> XSHIFT);
}
class Cycle {
    constructor(arr) {
        this.arr = arr;
        this.index = -1 | 0;
    }
    next() {
        this.index++;
        this.index %= this.arr.length;
        this.index |= 0;
        return this.arr[this.index];
    }
}
// create a class because the calculations for hash mix is stateful,
// i.e., the hastConst
class HashMix {
    constructor() {
        const INIT_A = 0x43b0d7e5;
        this.hashConst = INIT_A | 0;
    }
    mix(value) {
        value |= 0;
        this.hashConst |= 0;
        const MULT_A = 0x931e8875 | 0;
        value ^= this.hashConst | 0;
        this.hashConst = Math.imul(this.hashConst, MULT_A) | 0;
        value = Math.imul(value, this.hashConst) | 0;
        value ^= value >>> (XSHIFT | 0);
        return value | 0;
    }
}
const seedSequence32ConfigDefaults = {
    spawnKey: [],
    poolSize: DEFAULT_POOL_SIZE,
    nChildrenSpawned: 0
};
class SeedSequence32 {
    constructor(config) {
        this.entropy = config.entropy;
        this.spawnKey = config.spawnKey;
        this.poolSize = config.poolSize;
        this.nChildrenSpawned = config.nChildrenSpawned;
        if (this.entropy === null)
            throw new Error("entropy parameter cannot be null");
        if (this.poolSize < DEFAULT_POOL_SIZE)
            throw new Error("poolSize argument cannot be smaller than "
                + DEFAULT_POOL_SIZE);
        this.pool = new Int32Array(this.poolSize);
        this.mixEntropy(this.pool, this.getAssembledEntropy());
    }
    mixEntropy(mixer, entropyArray) {
        const hashMix = new HashMix();
        for (let i = 0 | 0; i < mixer.length; i++) {
            if (i < entropyArray.length)
                mixer[i] = hashMix.mix(entropyArray[i]);
            else
                mixer[i] = hashMix.mix(0 | 0);
        }
        for (let iSrc = 0 | 0; iSrc < mixer.length; iSrc++) {
            for (let iDst = 0 | 0; iDst < mixer.length; iDst++) {
                if (iSrc !== iDst) {
                    mixer[iDst] = mix(mixer[iDst], hashMix.mix(mixer[iSrc]));
                }
            }
        }
        for (let iSrc = mixer.length | 0; iSrc < entropyArray.length; iSrc++) {
            for (let iDst = 0 | 0; iDst < mixer.length; iDst++) {
                mixer[iDst] = mix(mixer[iDst], hashMix.mix(entropyArray[iSrc]));
            }
        }
    }
    getAssembledEntropy() {
        if (this.entropy === null)
            throw Error("entropy cannot be null");
        const runEntropy = this.entropy;
        const spawnEntropy = this.spawnKey;
        // zero-fill or pad in the first case, see Numpy code comments
        const oldSize = (spawnEntropy.length > 0 && runEntropy.length < this.poolSize) ?
            this.poolSize : runEntropy.length;
        const entropyArray = new Int32Array(oldSize + spawnEntropy.length);
        entropyArray.set(runEntropy);
        entropyArray.set(spawnEntropy, oldSize);
        return entropyArray;
    }
    generateState(nWords) {
        nWords |= 0;
        const INIT_B = 0x8b51f9dd | 0;
        const MULT_B = 0x58f38ded | 0;
        const state = new Int32Array(nWords);
        const srcCycle = new Cycle(this.pool);
        let hashConst = INIT_B | 0;
        for (let iDst = 0 | 0; iDst < nWords; iDst++) {
            let dataVal = srcCycle.next() | 0;
            dataVal ^= hashConst;
            hashConst = Math.imul(hashConst, MULT_B) | 0;
            dataVal = Math.imul(dataVal, hashConst) | 0;
            dataVal ^= dataVal >>> XSHIFT;
            state[iDst] = dataVal | 0;
        }
        return state;
    }
    spawn(nChildren) {
        nChildren |= 0;
        const oldLen = this.spawnKey.length | 0;
        const newSpawnKey = new Int32Array(oldLen + 1);
        if (oldLen > 0)
            newSpawnKey.set(this.spawnKey);
        const config = {
            entropy: this.entropy,
            spawnKey: newSpawnKey,
            poolSize: this.poolSize,
            nChildrenSpawned: this.nChildrenSpawned
        };
        const seqs = Array(nChildren);
        for (let i = 0 | 0; i < nChildren; i++) {
            config.spawnKey[oldLen] = (i + this.nChildrenSpawned) | 0;
            seqs[i | 0] = new SeedSequence32(config);
        }
        this.nChildrenSpawned += nChildren | 0;
        return seqs;
    }
}
//# sourceMappingURL=SeedSequence32.js.map