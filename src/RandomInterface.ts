// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

/**
 * This module contain interfaces for the random number bits generators.
 * @packageDocumentation
 */

import  {
    SeedSequence32
} from "./SeedSequence32";

import {
    Uint64
} from "./LongIntMaths";

export {
    IRandomBitsGenerator
};

/**
 * All bit generators must implement this interface,
 * so that a RandomDistributions object can call the bit generator.
 */
interface IRandomBitsGenerator  {
    readonly seedSequence: SeedSequence32;
    /**
     * This method should generate 64-bits of random value.
     * The result is passed by via the parameter, for speed.
     * This will be called by a RandomDistribution object to generate
     * other types of random numbers, e.g., standard normal.
     * @see RandomDistributions
     * @param result - the next random unsigned 64-bit integer to be returned
     * @returns - none; the parameter is updated, and object internal state is updated
     */
    nextUint64(result: Uint64): void;
}
