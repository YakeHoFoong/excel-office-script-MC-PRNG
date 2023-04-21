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

export {
    SeedSequence32
};

const MINIMUM_POOL_SIZE = 4;
const XSHIFT: number = 16 | 0;

/**
 * @internal
 * An internal function to support the hash mix calculations.
 */
function mix(x: number, y: number): number {
    const MIX_MULT_L: number = 0xca01f9dd | 0;
    const MIX_MULT_R: number = 0x4973f715 | 0;
    x |= 0;
    y |= 0;

    const result: number =
        ((Math.imul( MIX_MULT_L, x) | 0)
        - (Math.imul(MIX_MULT_R, y) | 0)) | 0;

    return result ^ (result >>> XSHIFT);
}

/**
 * @internal
 * An internal class to support the hash mix calculations.
 */
class Cycle  {
    private index: number;
    private readonly arr: Int32Array;
    constructor(arr: Int32Array)  {
        this.arr = arr;
        this.index = -1 | 0;
    }
    next(): number  {
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
class HashMix  {
    private hashConst: number;
    constructor()  {
        const INIT_A = 0x43b0d7e5;
        this.hashConst = INIT_A | 0;
    }
    mix(value: number): number {
        value |= 0;
        this.hashConst |= 0;
        const MULT_A: number = 0x931e8875 | 0;
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
    private readonly entropy: Int32Array;
    private readonly spawnKey: Int32Array;
    private readonly poolSize: number;
    private nChildrenSpawned: number;
    private readonly pool: Int32Array;
    private isReady: boolean;

    /**
     * @param entropy - this is the random seed, in Int32Array of any size
     * @param poolSize - pool size, minimum 4, just use this if not sure
     * @param parent - do **NOT** use this, it is only for internal use in the module
     */
    constructor(entropy: Int32Array, poolSize: number, parent?: SeedSequence32) {

        if (entropy === null || entropy.length === 0)
            throw new Error("entropy parameter cannot be null or empty");
        if (poolSize < MINIMUM_POOL_SIZE)
            throw new Error("poolSize argument cannot be smaller than "
                + MINIMUM_POOL_SIZE);

        this.entropy = new Int32Array(entropy);  // copy just to be safe
        this.poolSize = poolSize;
        this.pool = new Int32Array(poolSize);

        if (parent === undefined)  {  // constructor not called by spawn
            this.spawnKey = new Int32Array(0);
            this.nChildrenSpawned = 0;
        }
        else  { // constructor called by spawn
            this.spawnKey = new Int32Array(parent.spawnKey.length + 1);
            this.nChildrenSpawned = parent.nChildrenSpawned;
        }

        this.isReady = false;
    }
    private mixEntropy(mixer: Int32Array, entropyArray: Int32Array): void {
        const hashMix: HashMix = new HashMix();

        for (let i: number = 0 | 0; i < mixer.length; i++) {
            if (i < entropyArray.length)
                mixer[i] = hashMix.mix(entropyArray[i]);
            else
                mixer[i] = hashMix.mix(0 | 0);
        }

        for (let iSrc: number = 0 | 0; iSrc < mixer.length; iSrc++) {
            for (let iDst: number = 0 | 0; iDst < mixer.length; iDst++) {
                if (iSrc !== iDst) {
                    mixer[iDst] = mix(mixer[iDst],
                        hashMix.mix(mixer[iSrc]));

                }
            }
        }

        for (let iSrc: number = mixer.length | 0; iSrc < entropyArray.length; iSrc++) {
            for (let iDst: number = 0 | 0; iDst < mixer.length; iDst++) {
                mixer[iDst] = mix(mixer[iDst],
                    hashMix.mix(entropyArray[iSrc]));

            }
        }
    }

    private getAssembledEntropy(): Int32Array  {
        if (this.entropy === null)  throw Error("entropy cannot be null");
        const runEntropy: Int32Array = this.entropy;
        const spawnEntropy: Int32Array | [] = this.spawnKey;
        // zero-fill or pad in the first case, see Numpy code comments
        const oldSize: number =
            (spawnEntropy.length > 0 && runEntropy.length < this.poolSize) ?
                this.poolSize : runEntropy.length;

        const entropyArray: Int32Array =
            new Int32Array(oldSize + spawnEntropy.length);
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
    generateState(nWords: number): Int32Array  {
        nWords |= 0;

        if (!this.isReady) {
            this.mixEntropy(this.pool,
                this.getAssembledEntropy());
            this.isReady = true;
        }

        const INIT_B: number = 0x8b51f9dd | 0;
        const MULT_B: number = 0x58f38ded | 0;

        const state: Int32Array = new Int32Array(nWords);
        const srcCycle: Cycle = new Cycle(this.pool);
        let hashConst: number = INIT_B | 0;
        for (let iDst: number = 0 | 0; iDst < nWords; iDst++)  {
            let dataVal: number = srcCycle.next() | 0;
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
     * @param nChildren - the desired number of independent streams
     * @returns - an array of children (of the same class), of size nChildren
     */
    spawn(nChildren: number): SeedSequence32[]   {

        nChildren |= 0;

        const oldLen: number = this.spawnKey.length | 0;
        const seqs: SeedSequence32[] = Array<SeedSequence32>(nChildren);
        for (let i: number = 0 | 0; i < nChildren; i++)  {
            const seq: SeedSequence32 =
                new SeedSequence32(this.entropy, this.poolSize, this);
            if (oldLen > 0)
                seq.spawnKey.set(this.spawnKey);
            seq.spawnKey[oldLen] = (i + this.nChildrenSpawned) | 0;
            seqs[i | 0] = seq;
        }
        this.nChildrenSpawned += nChildren | 0;
        return seqs;

    }

}
