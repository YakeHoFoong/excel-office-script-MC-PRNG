// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

// This module implements the PCG64-DXSM random number generator.

import  {
    SeedSequence32
} from "./SeedSequence32";

import  {
    IRandomBitsGenerator
} from "./RandomInterface";

import {
    NumberPair,
    Uint64,
    Uint128
} from "./LongIntMaths";

export {
    PCG64DXSM
};

 class PCG64DXSM implements IRandomBitsGenerator  {
    readonly seedSequence;
    private readonly state: Uint128;
    private readonly inc: Uint128;
    private readonly multConst: Uint64;
    constructor(seedSequence: SeedSequence32)  {
        this.seedSequence = seedSequence;
        this.state = new Uint128();
        this.inc = new Uint128();
        this.multConst = new Uint64();
        const values: Int32Array = this.multConst.values;
        values[0] = 0x58b5;
        values[1] = 0xe4dd;
        values[2] = 0x2042;
        values[3] = 0xda94;
        const seeds: Int32Array = seedSequence.generateState(8);
        this.state.low64.from32bits(seeds[0], seeds[1]);
        this.state.high64.from32bits(seeds[2], seeds[3]);
        this.inc.low64.from32bits(seeds[4], seeds[5]);
        this.inc.high64.from32bits(seeds[6], seeds[7]);
    }
    next64(result: NumberPair): void {

        const lo: Uint64 = this.state.low64;
        const hi: Uint64 = this.state.high64;

        lo.values[0] |= 1;

        hi.inplace64RightShift32Xor();
        hi.inplaceModMult64x64(this.multConst);
        hi.inplace64RightShift48Xor();
        hi.inplaceModMult64x64(lo);

        hi.to32bits(result);
    }
}
