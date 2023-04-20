// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2015 Melissa E. O'Neill
// SPDX-FileCopyrightText: (c) 2019 NumPy Developers
// SPDX-License-Identifier: MIT

// This is a TypeScript port of some of the contents
// of the following parts of the Numpy library:
// https://github.com/numpy/numpy/blob/main/numpy/random/bit_generator.pyx
// https://github.com/numpy/numpy/blob/main/numpy/random/_common.pyx
// https://github.com/numpy/numpy/blob/main/numpy/random/_pcg64.pyx
// https://github.com/numpy/numpy/blob/main/numpy/random/src/pcg64/pcg64.h
// https://github.com/numpy/numpy/blob/main/numpy/random/src/pcg64/pcg64.c

// This module implements the PCG64-DXSM random number generator.

import  {
    SeedSequence32
} from "./SeedSequence32.js";

import  {
    IRandomBitsGenerator
} from "./RandomInterface.js";

import {
    NumberPair,
    Uint64,
    Uint128
} from "./LongIntMaths.js";

export {
    PCG64DXSM
};

// top-level code, set up the constants
const PCG_CHEAP_MULTIPLIER_128: Uint64 = new Uint64();
PCG_CHEAP_MULTIPLIER_128.values.set([0x58b5, 0xe4dd, 0x2042, 0xda94]);

const PCG_DEFAULT_MULTIPLIER: Uint128 = new Uint128();
PCG_DEFAULT_MULTIPLIER.low64.values.set([0xf645, 0x9fcc, 0xdf64, 0x4385]);
PCG_DEFAULT_MULTIPLIER.high64.values.set([0x5da4, 0x1fc6, 0xed05, 0x2360]);

 class PCG64DXSM implements IRandomBitsGenerator  {
    readonly seedSequence;
    private readonly state: Uint128;
    private readonly inc: Uint128;
    private readonly hi: Uint64;  // scratch value
    private readonly lo: Uint64;  // scratch value
    constructor(seedSequence: SeedSequence32)  {
        this.seedSequence = seedSequence;
        this.state = new Uint128();
        this.inc = new Uint128();
        this.hi = new Uint64();
        this.lo = new Uint64();

        // initialize the state
        const seeds: Int32Array = seedSequence.generateState(8);
        const initstate: Uint128 = new Uint128();
        initstate.low64.from32bits(seeds[2], seeds[3]);
        initstate.high64.from32bits(seeds[0], seeds[1]);

        this.inc.low64.from32bits(seeds[6], seeds[7]);
        this.inc.high64.from32bits(seeds[4], seeds[5]);

        this.inc.inplaceMod128LeftShift1or1();
        this.step_default();
        this.state.inplaceModAdd128(initstate);
        this.step_default();

    }

    private outputDxsm(result: NumberPair): void {
        const lo: Uint64 = this.lo;
        const hi: Uint64 = this.hi;

        lo.copyFrom(this.state.low64);
        hi.copyFrom(this.state.high64);

        lo.values[0] |= 1;

        hi.inplace64RightShift32Xor();
        hi.inplaceModMult64x64(PCG_CHEAP_MULTIPLIER_128);
        hi.inplace64RightShift48Xor();
        hi.inplaceModMult64x64(lo);

        hi.to32bits(result);
    }

    private step_cm(): void  {
        this.state.inplaceModMult128x64(PCG_CHEAP_MULTIPLIER_128);
        this.state.inplaceModAdd128(this.inc);
    }

    private step_default(): void  {
        this.state.inplaceModMult128x128(PCG_DEFAULT_MULTIPLIER);
        this.state.inplaceModAdd128(this.inc);
    }

    next64(result: NumberPair): void {
        this.outputDxsm(result);
        this.step_cm();
    }

}
