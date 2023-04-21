// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2015 Melissa E. O'Neill
// SPDX-FileCopyrightText: (c) 2019 NumPy Developers
// SPDX-License-Identifier: MIT

// This is a TypeScript port of almost all of the contents
// of the following part of the Numpy library:
// https://github.com/numpy/numpy/blob/main/numpy/random/bit_generator.pyx

export {
    SeedSequence32,
    ISeedSequence32Config,
    seedSequence32ConfigDefaults
};

const DEFAULT_POOL_SIZE = 4;
const XSHIFT: number = 16 | 0;
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

// create a class because the calculations for hash mix is stateful,
// i.e., the hastConst
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

interface ISeedSequence32Config  {
    readonly entropy: Int32Array,
    readonly spawnKey: Int32Array | [],
    readonly poolSize: number,
    readonly nChildrenSpawned: number
}

const seedSequence32ConfigDefaults:
    Pick<ISeedSequence32Config,
        'spawnKey' | 'poolSize' | 'nChildrenSpawned'> = {
    spawnKey: [],
    poolSize: DEFAULT_POOL_SIZE,
    nChildrenSpawned: 0
};

class SeedSequence32 {
    private readonly entropy: Int32Array;
    private readonly spawnKey: Int32Array | [];
    private readonly poolSize: number;
    private nChildrenSpawned: number;
    private readonly pool: Int32Array;
    constructor(config: ISeedSequence32Config) {
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
        this.mixEntropy(this.pool,
            this.getAssembledEntropy());
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

    generateState(nWords: number): Int32Array  {
        nWords |= 0;

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

    spawn(nChildren: number): SeedSequence32[]   {

        nChildren |= 0;

        const oldLen: number = this.spawnKey.length | 0;
        const newSpawnKey: Int32Array = new Int32Array(oldLen + 1);
        if (oldLen > 0)   newSpawnKey.set(this.spawnKey);
        const config: ISeedSequence32Config = {
            entropy: this.entropy,
            spawnKey: newSpawnKey,
            poolSize: this.poolSize,
            nChildrenSpawned: this.nChildrenSpawned
        };
        const seqs: SeedSequence32[] = Array(nChildren);
        for (let i: number = 0 | 0; i < nChildren; i++)  {
            config.spawnKey[oldLen] = (i + this.nChildrenSpawned) | 0;
            seqs[i | 0] = new SeedSequence32(config);
        }
        this.nChildrenSpawned += nChildren | 0;
        return seqs;

    }

}
