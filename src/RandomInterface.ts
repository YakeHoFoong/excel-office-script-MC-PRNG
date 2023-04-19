// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

// This module contain interfaces for the random number generators.

import  {
    SeedSequence32
} from "./SeedSequence32";

export {
    IRandomBitsGenerator,
    NumberPair
};

type NumberPair = {
    num1: Number;
    num2: Number;
}
interface IRandomBitsGenerator  {
    readonly seedSequence: SeedSequence32;
    // return results through the parameter
    // to avoid constantly new-ing new objects
    next64(result: NumberPair): void;
}
