// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

// a module that defines functions used in testing

export {
    int32toBigInt,
    intArrToBigInt,
    bigIntToIntArr64,
    bigIntToIntArr128
};

function int32toBigInt(x: number): bigint {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit: bigint = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}
// for printing during testing
function intArrToBigInt(arr: Int32Array): bigint {
    let result: bigint = 0n;
    for (let i: number = 0; i < arr.length; i++) {
        result |= int32toBigInt(arr[i]) << BigInt(16 * i);
    }
    return result;
}
// for printing during testing
function bigIntToIntArr64(x: bigint): Int32Array {
    const result: Int32Array = new Int32Array(4);
    for (let i: number = 0; i < 4; i++) {
        result[i] = Number(x & 0xFFFFn);
        x >>= 16n;
    }
    return result;
}

// for printing during testing
function bigIntToIntArr128(x: bigint): Int32Array {
    const result: Int32Array = new Int32Array(7);
    for (let i: number = 0; i < 6; i++) {
        result[i] = Number(x & 0xFFFFn);
        x >>= 16n;
    }
    result[6] = Number(x);  // last entry is a 32-bit word
    return result;
}