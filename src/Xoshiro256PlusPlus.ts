// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-FileCopyrightText: (c) 2019 David Blackman and Sebastiano Vigna <vigna@acm.org>
// SPDX-License-Identifier: MIT

/**
 * This is a TypeScript port of the reference implementation:
 * @see [xoshiro256plusplus.c](https://prng.di.unimi.it/xoshiro256plusplus.c)
 * This module implements the Xoshiro256++ random number generator.
 * @packageDocumentation
 */

import { IRandomBitsGenerator } from "./RandomInterface.js";

import { Uint64 } from "./LongIntMaths.js";

export { Xoshiro256PlusPlus };

// top-level code, set up the constants
//const PCG_CHEAP_MULTIPLIER_128: Uint64 = new Uint64();
//PCG_CHEAP_MULTIPLIER_128.values.set([0x58b5, 0xe4dd, 0x2042, 0xda94]);

//const PCG_DEFAULT_MULTIPLIER: Uint128 = new Uint128();
//PCG_DEFAULT_MULTIPLIER.low64.values.set([0xf645, 0x9fcc, 0xdf64, 0x4385]);
//PCG_DEFAULT_MULTIPLIER.high64.values.set([0x5da4, 0x1fc6, 0xed05, 0x2360]);

/**
 * This class corresponds to the same BitGenerator in Numpy.
 * @see [distributions.c in Numpy](https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/distributions.c)
 */
class Xoshiro256PlusPlus implements IRandomBitsGenerator {
  static readonly SEED_SEQ_NUM_WORDS = 8;
  private readonly state: Array<Uint64>;
  private readonly temp: Uint64; // scratch value

  /**
   * This class corresponds to the same BitGenerator in Numpy.
   * @param seedsFromSS32 - an Int32Array returned from calling the
   * {@link SeedSequence32.generateState} method of a {@link SeedSequence32} object,
   * with parameter of {@link PCG64DXSM.SEED_SEQ_NUM_WORDS}.
   */
  constructor(seedsFromSS32: Int32Array) {
    this.state = new Array<Uint64>(4);
    this.state[0] = new Uint64();
    this.state[1] = new Uint64();
    this.state[2] = new Uint64();
    this.state[3] = new Uint64();
    this.temp = new Uint64();

    // initialize the state
    this.state[0].from32bits(seedsFromSS32[0], seedsFromSS32[1]);
    this.state[1].from32bits(seedsFromSS32[2], seedsFromSS32[3]);
    this.state[2].from32bits(seedsFromSS32[4], seedsFromSS32[5]);
    this.state[3].from32bits(seedsFromSS32[6], seedsFromSS32[7]);

    // run a few steps first, like PCG64DXSM?
    this.step();
    this.step();
  }

  /**
   * This method is used internally to move the internal state forward.
   */
  private step(): void {
    const temp: Uint64 = this.temp;

    temp.copyFrom(this.state[1]);
    temp.inplace64LeftShift(17);

    this.state[2].inplaceXorWith(this.state[0]);
    this.state[3].inplaceXorWith(this.state[1]);
    this.state[1].inplaceXorWith(this.state[2]);
    this.state[0].inplaceXorWith(this.state[3]);

    this.state[2].inplaceXorWith(temp);

    this.state[3].inplace64RotateLeft(45);
  }

  /**
   * This method generates 64-bits of random value.
   * @param result - the next random unsigned 64-bit integer to be returned
   * @returns - none; the parameter is updated, and object internal state is updated
   */
  nextUint64(result: Uint64): void {
    result.copyFrom(this.state[0]);
    result.inplace64ModAdd(this.state[3]);
    result.inplace64RotateLeft(23);
    result.inplace64ModAdd(this.state[0]);

    this.step();
  }
}
