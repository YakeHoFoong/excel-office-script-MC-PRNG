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

// This module implements unit uniform double and standard normal.

import  {
    IRandomBitsGenerator
} from "./RandomInterface.js";

import {
    Uint64
} from "./LongIntMaths.js";

export {
    RandomDistributions
};

// for conversion to double, copied from Numpy, see
// https://github.com/numpy/numpy/blob/main/numpy/random/_common.pxd
const UINT53_TO_DOUBLE: number =  1.0 / 9007199254740992.0;

class RandomDistributions  {
    readonly bitsGenerator: IRandomBitsGenerator;
    private readonly uint64: Uint64;
    constructor(bitsGenerator: IRandomBitsGenerator)  {
        this.bitsGenerator = bitsGenerator;
        this.uint64 = new Uint64();
    }

    // returns next random number in the semi-open interval
    // [0, 1)
    randomUnit(): number {
         this.bitsGenerator.nextUint64(this.uint64);
         const vals: Int32Array = this.uint64.values;
         // 5 + 16 + 8 = 29 bits
         const loPart: number =
             (vals[0] >>> 11) | (vals[1] << 5) |  ((vals[2] & 0xFF) << 21);
         // 8 + 16 = 24 bits
         const hiPart: number = (vals[2] >>> 8) | (vals[3] << 8);
         const result: number =
             (hiPart * 0x20000000 + loPart) * UINT53_TO_DOUBLE;
         return result;
     }
}
