// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
import {
    Uint64,
    Uint128,
    InplaceModMult128x64,
    InplaceModMult64x64,
    InplaceModAdd128,
    Inplace64RightShift32Xor,
    Inplace64RightShift48Xor
} from "../src/LongIntMaths.js";

import { expect } from 'chai';
import "mocha";

describe("Long 128-bit and 64-bit integer maths", function (): void {

    describe("In place modulo multiply 128x64 verify using bigint", function (): void {
        it("In place modulo multiply 128x64 Test 1", function (done): void {
            const testMul1: bigint = 0xa234f345090fbcdf290650968cae888dn;
            const testMul2: bigint = 0x290809ce560989den;
            const expectedResult: bigint = (testMul1 * testMul2) % 0x100000000000000000000000000000000n;
            // result is returned in first parameter
            const calculatedResult: Uint128 = new Uint128();
            const num2: Uint64 = new Uint64();
            calculatedResult.fromBigint(testMul1);
            num2.fromBigint(testMul2)
            InplaceModMult128x64(calculatedResult, num2);
            const actualResult: bigint = calculatedResult.toBigInt();
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
            const calculatedResult: Uint64 = new Uint64();
            const num2: Uint64 = new Uint64();
            calculatedResult.fromBigint(testMul1);
            num2.fromBigint(testMul2)
            InplaceModMult64x64(calculatedResult, num2);
            const actualResult: bigint = calculatedResult.toBigInt();
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
            const calculatedResult: Uint128 = new Uint128();
            const num2: Uint64 = new Uint128();
            calculatedResult.fromBigint(testAdd1);
            num2.fromBigint(testAdd2)
            InplaceModAdd128(calculatedResult, num2);
            const actualResult: bigint = calculatedResult.toBigInt();
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

    describe("In place modulo right shift 32 xor original verify using bigint", function (): void {
        it("In place modulo right shift 32 xor original Test 1", function (done): void {
            const testNum: bigint = 0x6dbf895699a98056n;
            const expectedResult: bigint = (testNum ^ (testNum >> 32n)) % 0x10000000000000000n;
            // result is returned in the parameter
            const calculatedResult: Uint64 = new Uint64();
            calculatedResult.fromBigint(testNum);
            Inplace64RightShift32Xor(calculatedResult);
            const actualResult: bigint = calculatedResult.toBigInt();
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

    describe("In place modulo right shift 48 xor original verify using bigint", function (): void {
        it("In place modulo right shift 48 xor original Test 1", function (done): void {
            const testNum: bigint = 0x890f8f345afead45n;
            const expectedResult: bigint = (testNum ^ (testNum >> 48n)) % 0x10000000000000000n;
            // result is returned in the parameter
            const calculatedResult: Uint64 = new Uint64();
            calculatedResult.fromBigint(testNum);
            Inplace64RightShift48Xor(calculatedResult);
            const actualResult: bigint = calculatedResult.toBigInt();
            expect(actualResult).to.equal(expectedResult);
            done();
        });
    });

});
