// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2015 Melissa E. O'Neill
// SPDX-FileCopyrightText: (c) 2019 NumPy Developers
// SPDX-License-Identifier: MIT
/**
 * This is a TypeScript port of almost all of the contents
 * of the following part of the Numpy library:
 * @see [bit_generator.pyx in Numpy](https://github.com/numpy/numpy/blob/main/numpy/random/bit_generator.pyx)
 *
 * This module contains the calculations to produce high-quality seeds
 * based on inputs of low-quality seeds.
 * @packageDocumentation
 */
export { SeedSequence32 };
const MINIMUM_POOL_SIZE = 4;
const XSHIFT = 16 | 0;
/**
 * @internal
 * An internal function to support the hash mix calculations.
 */
function mix(x, y) {
    const MIX_MULT_L = 0xca01f9dd | 0;
    const MIX_MULT_R = 0x4973f715 | 0;
    x |= 0;
    y |= 0;
    const result = ((Math.imul(MIX_MULT_L, x) | 0) - (Math.imul(MIX_MULT_R, y) | 0)) | 0;
    return result ^ (result >>> XSHIFT);
}
/**
 * @internal
 * An internal class to support the hash mix calculations.
 */
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
/**
 * @internal
 * An internal class to support the hash mix calculations, which are stateful,
 * i.e., the hastConst.
 */
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
/**
 * A class to generate high-quality random seeds from a simple low-quality random seed.
 * This class also supports the creation of independent random streams,
 * by providing the facility to generate independent children and grandchildren (and so forth).
 */
class SeedSequence32 {
    /**
     * @param config - contains either entropy and pool size, or parent and child number.
     */
    constructor(config) {
        if (config.CONFIG_TYPE === "PARENT") {
            if (config.entropy === null || config.entropy.length === 0)
                throw new Error("entropy parameter cannot be null or empty");
            if (config.poolSize < MINIMUM_POOL_SIZE)
                throw new Error("poolSize parameter cannot be smaller than " + MINIMUM_POOL_SIZE);
            this.entropy = new Int32Array(config.entropy); // copy to be safe
            this.poolSize = config.poolSize;
            this.nChildrenSpawned = 0 | 0;
            this.spawnKey = new Int32Array(0);
        }
        else {
            // config.CONFIG_TYPE === "CHILD"
            this.entropy = config.parent.entropy;
            this.poolSize = config.parent.poolSize;
            this.nChildrenSpawned = config.nChildrenSpawned; // this is before the parent spawned the children
            const oldKeyLen = config.parent.spawnKey.length | 0;
            this.spawnKey = new Int32Array(oldKeyLen + 1);
            if (oldKeyLen > 0)
                this.spawnKey.set(config.parent.spawnKey);
            this.spawnKey[oldKeyLen] = (config.childIndex + this.nChildrenSpawned) | 0;
        }
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
        const oldSize = spawnEntropy.length > 0 && runEntropy.length < this.poolSize ? this.poolSize : runEntropy.length;
        const entropyArray = new Int32Array(oldSize + spawnEntropy.length);
        entropyArray.set(runEntropy);
        entropyArray.set(spawnEntropy, oldSize);
        return entropyArray;
    }
    /**
     * Based on the entropy (seed) and pool size provided when this object was created,
     * this method returns a high-quality random see.
     * @see {@link "constructor"}
     * @param nWords - the number of 32-bit words desired in the result
     * @returns - a high-quality random seed in an Int32Array of length nWords specified by the parameter
     */
    generateState(nWords) {
        if (!Number.isInteger(nWords) || nWords < 1)
            throw Error("SeedSequence32 generateState method must be called with a whole number.");
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
    /**
     * This is used for creating independent streams in Monte Carlo simulations.
     * @param nChildren - the desired number of independent streams, must be a whole number
     * @returns - an array of children (of the same class), of size nChildren
     */
    spawn(nChildren) {
        if (!Number.isInteger(nChildren) || nChildren < 1)
            throw Error("SeedSequence32 spawn method must be called with a whole number.");
        nChildren |= 0;
        const seqs = Array(nChildren);
        const nChildrenSpawned = this.nChildrenSpawned;
        this.nChildrenSpawned += nChildren | 0;
        return (index) => {
            if (seqs[index] === undefined)
                seqs[index] = new SeedSequence32({
                    parent: this,
                    nChildrenSpawned: nChildrenSpawned,
                    childIndex: index,
                    CONFIG_TYPE: "CHILD",
                });
            return seqs[index];
        };
    }
}
//# sourceMappingURL=SeedSequence32.js.map