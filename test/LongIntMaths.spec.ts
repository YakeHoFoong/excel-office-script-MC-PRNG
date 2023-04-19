// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
import {
    InplaceModMult128x64,
    InplaceModMult64x64,
    InplaceModAdd128,
    Inplace64RightShift32Xor,
    Inplace64RightShift48Xor
} from "../src/LongIntMaths.js";

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

    describe("In place modulo multiply 128x64 verify using bigint", function (): void {
        it("In place modulo multiply 128x64 Test 1", function (done): void {
            const testMul1: bigint = 0xa234f345090fbcdf290650968cae888dn;
            const testMul2: bigint = 0x290809ce560989den;
            const expectedResult: bigint = (testMul1 * testMul2) % 0x100000000000000000000000000000000n;
            // result is returned in first parameter
            const calculatedResult: Int32Array = bigIntToIntArr128(testMul1);
            InplaceModMult128x64(calculatedResult, bigIntToIntArr64(testMul2));
            const actualResult: bigint = intArrToBigInt(calculatedResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

    describe("In place modulo multiply 64x64 verify using bigint", function (): void {
        it("In place modulo multiply 64x64 Test 1", function (done): void {
            const testMul1: bigint = 0xce3468ab6798201fn;
            const testMul2: bigint = 0xe345bd45689a7c39n;
            const expectedResult: bigint = (testMul1 * testMul2) % 0x10000000000000000n;
            // result is returned in first parameter
            const calculatedResult: Int32Array = bigIntToIntArr64(testMul1);
            InplaceModMult64x64(calculatedResult, bigIntToIntArr64(testMul2));
            //const calculatedResult: Int32Array = bigIntToIntArr128(testMul1);
            //InplaceModMult128x64(calculatedResult, bigIntToIntArr64(testMul2));
            const actualResult: bigint = intArrToBigInt(calculatedResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

    describe("In place modulo sum verify using bigint", function (): void {
        it("In place modulo sum Test 1", function (done): void {
            const testAdd1: bigint = 0x6dbf895699a980568098bdbdf6378398n;
            const testAdd2: bigint = 0x57806890a2343759890f8f345afead45n;
            const expectedResult: bigint = (testAdd1 + testAdd2) % 0x100000000000000000000000000000000n;
            // result is returned in first parameter
            const calculatedResult: Int32Array = bigIntToIntArr128(testAdd1);
            InplaceModAdd128(calculatedResult, bigIntToIntArr128(testAdd2));
            const actualResult: bigint = intArrToBigInt(calculatedResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

    describe("In place modulo right shift 32 xor original verify using bigint", function (): void {
        it("In place modulo right shift 32 xor original Test 1", function (done): void {
            const testNum: bigint = 0x6dbf895699a98056n;
            const expectedResult: bigint = (testNum ^ (testNum >> 32n)) % 0x10000000000000000n;
            // result is returned in the parameter
            const calculatedResult: Int32Array = bigIntToIntArr128(testNum);
            Inplace64RightShift32Xor(calculatedResult);
            const actualResult: bigint = intArrToBigInt(calculatedResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

    describe("In place modulo right shift 48 xor original verify using bigint", function (): void {
        it("In place modulo right shift 48 xor original Test 1", function (done): void {
            const testNum: bigint = 0x890f8f345afead45n;
            const expectedResult: bigint = (testNum ^ (testNum >> 48n)) % 0x10000000000000000n;
            // result is returned in the parameter
            const calculatedResult: Int32Array = bigIntToIntArr128(testNum);
            Inplace64RightShift48Xor(calculatedResult);
            const actualResult: bigint = intArrToBigInt(calculatedResult);
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

});