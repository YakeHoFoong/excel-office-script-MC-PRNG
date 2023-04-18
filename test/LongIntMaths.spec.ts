// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
import { ModMultUint128Uint64, ModAdd128 } from "../src/LongIntMaths.js";
import { expect } from 'chai';
import "mocha";
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
    result[6] = Number(x); // last one is a 32-bit word
    return result;
}
describe("Long 128-bit and 64-bit integer maths", function (): void {
    describe("Modulo multiply verify using bigint", function (): void {
        it("Modulo Multiply Test 1", function (done): void {
            const testMul1: bigint = 0xa234f345090fbcdf290650968cae888dn;
            const testMul2: bigint = 0x290809ce560989den;
            const expectedResult: bigint = (testMul1 * testMul2) % 0x100000000000000000000000000000000n;
            const calcResult: Int32Array = new Int32Array(7);
            ModMultUint128Uint64(bigIntToIntArr128(testMul1), bigIntToIntArr64(testMul2), calcResult);
            const actualResult: bigint = intArrToBigInt(calcResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });
    describe("Modulo Sum verify using bigint", function (): void {
        it("Modulo Multiply Test 1", function (done): void {
            const testAdd1: bigint = 0x6dbf895699a980568098bdbdf6378398n;
            const testAdd2: bigint = 0x57806890a2343759890f8f345afead45n;
            const expectedResult: bigint = (testAdd1 + testAdd2) % 0x100000000000000000000000000000000n;
            const calcResult: Int32Array = new Int32Array(7);
            ModAdd128(bigIntToIntArr128(testAdd1), bigIntToIntArr128(testAdd2), calcResult);
            const actualResult: bigint = intArrToBigInt(calcResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });
});
