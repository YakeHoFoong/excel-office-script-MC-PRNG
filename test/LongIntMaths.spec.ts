// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { Uint64, Uint128 } from "../src/LongIntMaths.js";

import { expect } from "chai";
import { describe, it } from "mocha";

describe("Long 128-bit and 64-bit integer maths", function (): void {
  describe("In place modulo multiply 128x128 verify using bigint", function (): void {
    it("In place modulo multiply 128x128 Test 1", function (done): void {
      const testMul1 = 0xa234f345090fbcdf290650968cae888dn;
      const testMul2 = 0xc1217be098ca3210290809ce560989den;
      const expectedResult: bigint = (testMul1 * testMul2) % 0x100000000000000000000000000000000n;
      // result is returned in first parameter
      const calculatedResult: Uint128 = new Uint128();
      const num2: Uint128 = new Uint128();
      calculatedResult.fromBigint(testMul1);
      num2.fromBigint(testMul2);
      calculatedResult.inplaceModMult128x128(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place modulo multiply 128x64 verify using bigint", function (): void {
    it("In place modulo multiply 128x64 Test 1", function (done): void {
      const testMul1 = 0xa234f345090fbcdf290650968cae888dn;
      const testMul2 = 0x290809ce560989den;
      const expectedResult: bigint = (testMul1 * testMul2) % 0x100000000000000000000000000000000n;
      // result is returned in first parameter
      const calculatedResult: Uint128 = new Uint128();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testMul1);
      num2.fromBigint(testMul2);
      calculatedResult.inplaceModMult128x64(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place modulo multiply 64x64 verify using bigint", function (): void {
    it("In place modulo multiply 64x64 Test 1", function (done): void {
      const testMul1 = 0xce3468ab6798201fn;
      const testMul2 = 0xe345bd45689a7c39n;
      const expectedResult: bigint = (testMul1 * testMul2) % 0x10000000000000000n;
      // result is returned in first parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testMul1);
      num2.fromBigint(testMul2);
      calculatedResult.inplaceModMult64x64(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place modulo sum verify using bigint", function (): void {
    it("In place modulo sum Test 1", function (done): void {
      const testAdd1 = 0x6dbf895699a980568098bdbdf6378398n;
      const testAdd2 = 0x57806890a2343759890f8f345afead45n;
      const expectedResult: bigint = (testAdd1 + testAdd2) % 0x100000000000000000000000000000000n;
      // result is returned in first parameter
      const calculatedResult: Uint128 = new Uint128();
      const num2: Uint128 = new Uint128();
      calculatedResult.fromBigint(testAdd1);
      num2.fromBigint(testAdd2);
      calculatedResult.inplaceModAdd128(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place modulo right shift 32 xor original verify using bigint", function (): void {
    it("In place modulo right shift 32 xor original Test 1", function (done): void {
      const testNum = 0x6dbf895699a98056n;
      const expectedResult = (testNum ^ (testNum >> 32n)) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplace64RightShift32Xor();
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place modulo right shift 48 xor original verify using bigint", function (): void {
    it("In place modulo right shift 48 xor original Test 1", function (done): void {
      const testNum = 0x890f8f345afead45n;
      const expectedResult = (testNum ^ (testNum >> 48n)) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplace64RightShift48Xor();
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place modulo left shift 1 or 1 verify using bigint", function (): void {
    it("In place modulo left shift 1 or 1 Test 1", function (done): void {
      const testNum = 0x6dbf895699a980568098bdbdf6378398n;
      const expectedResult = ((testNum << 1n) | 1n) % 0x100000000000000000000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint128 = new Uint128();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplaceMod128LeftShift1or1();
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place 64-bit right shift 9 verify using bigint", function (): void {
    it("In place 64-bit right shift 9 Test 1", function (done): void {
      const testNum = 0x890f8f345afead45n;
      const expectedResult = (testNum >> 9n) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplace64RightShift9();
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("Rightmost 52-bits verify using bigint", function (): void {
    it("Rightmost 52-bits Test 1", function (done): void {
      const testNum = 0xf90f8f345afead45n;
      const expectedResult = Number(testNum % 0x10000000000000n);
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      const actualResult: number = calculatedResult.rightmost52bits();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place 64-bit rotate left verify using bigint", function (): void {
    it("In place 64-bit rotate left 45 Test 1", function (done): void {
      const testNum = 0x890f8f345afead45n;
      const expectedResult = (testNum << 45n) % 0x10000000000000000n | (testNum >> (64n - 45n));
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplace64RotateLeft(45);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
    it("In place 64-bit rotate left 23 Test 1", function (done): void {
      const testNum = 0x890f8f345afead45n;
      const expectedResult = (testNum << 23n) % 0x10000000000000000n | (testNum >> (64n - 23n));
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplace64RotateLeft(23);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place 64-bit shift left verify using bigint", function (): void {
    it("In place 64-bit shift left 17 Test 1", function (done): void {
      const testNum = 0x890f8f345afead45n;
      const expectedResult = (testNum << 17n) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum);
      calculatedResult.inplace64LeftShift(17);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place 64-bit modulo add verify using bigint", function (): void {
    it("In place 64-bit modulo add Test 1", function (done): void {
      const testNum1 = 0x890f8f345afead45n;
      const testNum2 = 0x3abe3246790f8ad4n;
      const expectedResult = (testNum1 + testNum2) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum1);
      num2.fromBigint(testNum2);
      calculatedResult.inplace64ModAdd(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
    it("In place 64-bit modulo add Test 2", function (done): void {
      const testNum1 = 0x890f8f34ffffffffn;
      const testNum2 = 0x3abe324600000001n;
      const expectedResult = (testNum1 + testNum2) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum1);
      num2.fromBigint(testNum2);
      calculatedResult.inplace64ModAdd(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
    it("In place 64-bit modulo add Test 3", function (done): void {
      const testNum1 = 0x890f8f3400000001n;
      const testNum2 = 0x3abe3246ffffffffn;
      const expectedResult = (testNum1 + testNum2) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum1);
      num2.fromBigint(testNum2);
      calculatedResult.inplace64ModAdd(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
    it("In place 64-bit modulo add Test 4", function (done): void {
      const testNum1 = 0x890f8f3400000001n;
      const testNum2 = 0x3abe324600000001n;
      const expectedResult = (testNum1 + testNum2) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum1);
      num2.fromBigint(testNum2);
      calculatedResult.inplace64ModAdd(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
    it("In place 64-bit modulo add Test 5", function (done): void {
      const testNum1 = 0x890f8f34ffffffffn;
      const testNum2 = 0x3abe3246ffffffffn;
      const expectedResult = (testNum1 + testNum2) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum1);
      num2.fromBigint(testNum2);
      calculatedResult.inplace64ModAdd(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });

  describe("In place 64-bit Xor with verify using bigint", function (): void {
    it("In place 64-bit Xor with 45 Test 1", function (done): void {
      const testNum1 = 0x890f8f345afead45n;
      const testNum2 = 0x3abe3246790f8ad4n;
      const expectedResult = (testNum1 ^ testNum2) % 0x10000000000000000n;
      // result is returned in the parameter
      const calculatedResult: Uint64 = new Uint64();
      const num2: Uint64 = new Uint64();
      calculatedResult.fromBigint(testNum1);
      num2.fromBigint(testNum2);
      calculatedResult.inplaceXorWith(num2);
      const actualResult: bigint = calculatedResult.toBigInt();
      expect(actualResult).to.equal(expectedResult);
      done();
    });
  });
});
