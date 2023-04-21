// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

/**
 * This module contain interfaces for the random number generators.
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

interface IRandomBitsGenerator  {
    readonly seedSequence: SeedSequence32;
    // return results through the parameter
    // to avoid constantly new-ing new objects
    nextUint64(result: Uint64): void;
}
