// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2015 Melissa E. O'Neill
// SPDX-FileCopyrightText: (c) 2019 NumPy Developers
// SPDX-License-Identifier: MIT

/**
 * This is a TypeScript port of some of the contents
 * of the following part of the Numpy library:
 * @see [distributions.c in Numpy](https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/distributions.c)
 * This module implements the PCG64-DXSM random number generator.
 * @packageDocumentation
 */

import { IRandomBitsGenerator } from "./RandomInterface.js";

import { Uint64, Uint128 } from "./LongIntMaths.js";

export { PCG64DXSM };

// top-level code, set up the constants
const PCG_CHEAP_MULTIPLIER_128: Uint64 = new Uint64();
PCG_CHEAP_MULTIPLIER_128.from32bits(0xe4dd58b5, 0xda942042);

const PCG_DEFAULT_MULTIPLIER: Uint128 = new Uint128();
PCG_DEFAULT_MULTIPLIER.from32bits(0x9fccf645, 0x4385df64, 0x1fc65da4, 0x2360ed05);

/**
 * This class corresponds to the same BitGenerator in Numpy.
 * @see [distributions.c in Numpy](https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/distributions.c)
 */
class PCG64DXSM implements IRandomBitsGenerator {
  static readonly SEED_SEQ_NUM_WORDS = 8; // 8 x 32 = 256 bits internal state
  private readonly state: Uint128;
  private readonly inc: Uint128;
  private readonly lo: Uint64; // scratch value

  /**
   * This class corresponds to the same BitGenerator in Numpy.
   * @param seedsFromSS32 - an Int32Array returned from calling the
   * {@link SeedSequence32.generateState} method of a {@link SeedSequence32} object,
   * with parameter of {@link PCG64DXSM.SEED_SEQ_NUM_WORDS}.
   */
  constructor(seedsFromSS32: Int32Array) {
    this.state = new Uint128();
    this.inc = new Uint128();
    this.lo = new Uint64();

    // initialize the state
    const initstate: Uint128 = new Uint128();
    initstate.from32bits(seedsFromSS32[2], seedsFromSS32[3], seedsFromSS32[0], seedsFromSS32[1]);

    this.inc.from32bits(seedsFromSS32[6], seedsFromSS32[7], seedsFromSS32[4], seedsFromSS32[5]);

    this.inc.inplaceMod128LeftShift1or1();
    this.step_default();
    this.state.inplaceModAdd128(initstate);
    this.step_default();
  }

  /**
   * This method is used together with the DXSM calculation.
   * It uses the 64-bit Cheap Multiplier instead of the 128-bit efault Multiplier.
   */
  private step_cm(): void {
    this.state.inplaceModMult128x64(PCG_CHEAP_MULTIPLIER_128);
    this.state.inplaceModAdd128(this.inc);
  }

  /**
   * This method is needed only for the initial seeding of the PRNG.
   * It uses the 128-bit efault Multiplier instead of the 64-bit Cheap Multiplier.
   */
  private step_default(): void {
    this.state.inplaceModMult128x128(PCG_DEFAULT_MULTIPLIER);
    this.state.inplaceModAdd128(this.inc);
  }

  /**
   * This method generates 64-bits of random value using the DXSM method.
   * @param result - the next random unsigned 64-bit integer to be returned
   * @returns - none; the parameter is updated, and object internal state is updated
   */
  nextUint64(result: Uint64): void {
    const lo: Uint64 = this.lo; // lo is scratch value

    lo.copyFrom(this.state.low64);
    result.copyFrom(this.state.high64);

    lo.values[0] |= 1;

    result.inplace64RightShift32Xor();
    result.inplaceModMult64x64(PCG_CHEAP_MULTIPLIER_128);
    result.inplace64RightShift48Xor();
    result.inplaceModMult64x64(lo);

    this.step_cm();
  }
}
