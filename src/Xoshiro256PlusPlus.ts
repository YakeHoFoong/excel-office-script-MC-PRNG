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
import { SeedSequence32 } from "./SeedSequence32.js";

export { Xoshiro256PlusPlus };

// top-level code, set up the constants
const JUMP = new Array<Uint64>(4);
JUMP[0] = new Uint64();
JUMP[1] = new Uint64();
JUMP[2] = new Uint64();
JUMP[3] = new Uint64();
JUMP[0].from32bits(0x3cfd0aba, 0x180ec6d3);
JUMP[1].from32bits(0xf0c9392c, 0xd5a61266);
JUMP[2].from32bits(0xe03fc9aa, 0xa9582618);
JUMP[3].from32bits(0x29b1661c, 0x39abdc45);

/**
 * This class corresponds to the same BitGenerator in Numpy.
 * @see [distributions.c in Numpy](https://github.com/numpy/numpy/blob/main/numpy/random/src/distributions/distributions.c)
 */
class Xoshiro256PlusPlus implements IRandomBitsGenerator {
  static readonly SEED_SEQ_NUM_WORDS = 8; // 8 x 32 = 256 bits internal state
  private readonly state: Array<Uint64>;
  private readonly temp: Uint64; // scratch value

  /**
   * This class corresponds to the same BitGenerator in Numpy; however, Numpy does not have Xoshiro256++.
   * @param initialState - an Int32Array returned from calling the
   * {@link SeedSequence32.generateState} method of a {@link SeedSequence32} object,
   * with parameter of {@link Xoshiro256PlusPlus.SEED_SEQ_NUM_WORDS}.
   * For streams, use either {@link SeedSequence32.spawn} just like for the class {@link PCG64DXSM} or
   * use {@link createStreamsFunction} in this class, which is similar but uses jumps.
   */
  constructor(initialState: Int32Array) {
    this.state = new Array<Uint64>(4);
    this.state[0] = new Uint64();
    this.state[1] = new Uint64();
    this.state[2] = new Uint64();
    this.state[3] = new Uint64();
    this.temp = new Uint64();

    // initialize the state
    this.state[0].from32bits(initialState[0], initialState[1]);
    this.state[1].from32bits(initialState[2], initialState[3]);
    this.state[2].from32bits(initialState[4], initialState[5]);
    this.state[3].from32bits(initialState[6], initialState[7]);

    // run a few steps first, like PCG64DXSM?
    this.step();
    this.step();
  }

  /**
   * This method is used internally to jump the internal state forward.
   * @returns - an Int32Array containing the state
   */
  private stateInInt32Array(): Int32Array {
    const result: Int32Array = new Int32Array(Xoshiro256PlusPlus.SEED_SEQ_NUM_WORDS);
    result[0] = this.state[0].values[0];
    result[1] = this.state[0].values[1];
    result[2] = this.state[1].values[0];
    result[3] = this.state[1].values[1];
    result[4] = this.state[2].values[0];
    result[5] = this.state[2].values[1];
    result[6] = this.state[3].values[0];
    result[7] = this.state[3].values[1];
    return result;
  }

  /**
   * This method is used internally to move the internal state forward.
   * @returns - none; object internal state is updated
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

  /**
   * This is used for creating independent streams in Monte Carlo simulations.
   * @param seq - {@link SeedSequence32} object to generate the initial state; subsequent seed states are jumps forward
   * @returns - a function that takes a stream number and returns the seed state for that stream number
   */
  static createStreamsFunction(seq: SeedSequence32): (a: number) => Int32Array {
    const seedStates: Int32Array[] = [];
    // starting value
    seedStates.push(new Int32Array(seq.generateState(Xoshiro256PlusPlus.SEED_SEQ_NUM_WORDS)));
    // internal object
    const myObj: Xoshiro256PlusPlus = new Xoshiro256PlusPlus(seedStates[0]);

    // temporary working variables
    const s0 = new Uint64();
    const s1 = new Uint64();
    const s2 = new Uint64();
    const s3 = new Uint64();

    // return a function that takes the stream number as input and returns the initial state for that stream
    // note that generally index is equal to stream number - 1
    return (index: number): Int32Array => {
      // calculate the memoized values if not yet calculated
      while (seedStates.length < index + 1) {
        // we use the jump but not the long jump
        s0.from32bits(0, 0);
        s1.from32bits(0, 0);
        s2.from32bits(0, 0);
        s3.from32bits(0, 0);

        for (let i = 0; i < 4; i++) {
          for (let b = 1; b <= 64; b++) {
            if (JUMP[i].isBitNfromRightSet(b)) {
              s0.inplaceXorWith(myObj.state[0]);
              s1.inplaceXorWith(myObj.state[1]);
              s2.inplaceXorWith(myObj.state[2]);
              s3.inplaceXorWith(myObj.state[3]);
            }
            myObj.step();
          }
        }

        myObj.state[0].copyFrom(s0);
        myObj.state[1].copyFrom(s1);
        myObj.state[2].copyFrom(s2);
        myObj.state[3].copyFrom(s3);

        seedStates.push(myObj.stateInInt32Array());
      }
      return seedStates[index];
    };
  }
}
