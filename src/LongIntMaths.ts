// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

// This module contain functions that perform arithmetic
// for 128bit and 64bit integers for the random number generators.
// Currently only implemented those needed for the PCG64-DXSM generator.

export {
    int32toBigInt,
    Uint,
    Uint64,
    Uint128,
    InplaceModMult128x64,
    InplaceModMult64x64,
    InplaceModAdd128,
    Inplace64RightShift32Xor,
    Inplace64RightShift48Xor
};

// mainly for testing
function int32toBigInt(x: number): bigint {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit: bigint = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}

abstract class Uint  {
    // each element is a 16-bit value
    // except for the last one for Uint128, a 32-bit value
    readonly values: Int32Array;
    protected constructor(numElems: number) {
        this.values = new Int32Array(numElems);
    }
    // mainly used for testing only
    public fromBigint(x: bigint): void  {
        const n: number = this.values.length;
        for (let i: number = 0; i < n; i++) {
            if (i === 6)  {
                // for Uint128, last entry is a 32-bit word
                this.values[i] = Number(x);
                break;  // exit for
            }
            this.values[i] = Number(x & 0xFFFFn);
            x >>= 16n;
        }
    }
    // mainly used for testing only
    public toBigInt(): bigint  {
        let result: bigint = 0n;
        const arr: Int32Array = this.values;
        for (let i: number = 0; i < arr.length; i++) {
            result |= int32toBigInt(arr[i]) << BigInt(16 * i);
        }
        return result;
    }
}

class Uint64 extends Uint {
    constructor()  {
        super(4);
    }
}

class Uint128 extends Uint {
    constructor()  {
        super(7);
    }
}

// 128-bit (64-bit) integer is represented by 7 (4) 32-bit words,
// but each is only filled with a 16-bit number, except for
// the leftmost, which is a 32-bit number.

// Result is returned in the first parameter
// The algorithm below uses traditional long multiplication
/*
    a7     a6   	 a5     a4    	a3     a2    	a1      a0
				                    b3     b2       b1      b0
						                              b0 x a0
					                         b0 x a1
				                     b0 x a2
                   			 b0 x a3
		               b0 x a4
             b0 x a5
    b0 x a67
                           					  b1 x a0
				                      b1 x a1
			                  b1 x a2
		               b1 x a3
	           b1 x a4
    b1 x a56
	                                  b2 x a0
		                       b2 x a1
	                    b2 x a2
                b2 x a3
     b2 x a45
		                       b3 x a0
		                 b3 x a1
	            b3 x a2
     b3 x a34
*/
function InplaceModMult128x64(
            int128: Uint128,
            int64: Uint64): void  {

    const Mask: number = 0xFFFF | 0;
    let val: number;
    let val1: number;
    let val2: number;

    const num128: Int32Array = int128.values;
    const num64: Int32Array = int64.values;

    val = Math.imul(num64[0] | 0, num128[0] | 0) | 0;
    let result0: number = val & Mask;
    val1 = val >>> 16;

    val = Math.imul(num64[0] | 0, num128[1] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result1: number = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;

    val = Math.imul(num64[0] | 0, num128[2] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[1] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[2] | 0, num128[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result2: number = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;

    val = Math.imul(num64[0] | 0, num128[3] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[2] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[2] | 0, num128[1] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[3] | 0, num128[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result3: number = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;

    val = Math.imul(num64[0] | 0, num128[4] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[3] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[2] | 0, num128[2] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[3] | 0, num128[1] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result4: number = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;

    val = Math.imul(num64[0] | 0, num128[5] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[4] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[2] | 0, num128[3] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    val = Math.imul(num64[3] | 0, num128[2] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result5: number = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;

    // leftmost, due to modulo, just let the product overflow
    val = num128[6] | 0;  // special 32-bit word
    val1 +=  Math.imul(num64[0] | 0, val | 0) | 0;
    val = (num128[6] << 16) | num128[5];
    val1 +=  Math.imul(num64[1] | 0, val | 0) | 0;
    val = (num128[5] << 16) | num128[4];
    val1 +=  Math.imul(num64[2] | 0, val | 0) | 0;
    val = (num128[4] << 16) | num128[3];
    val1 +=  Math.imul(num64[3] | 0, val | 0) | 0;
    num128[6] = val1 | 0;

    // fill in the in place results
    num128[0] = result0 | 0;
    num128[1] = result1 | 0;
    num128[2] = result2 | 0;
    num128[3] = result3 | 0;
    num128[4] = result4 | 0;
    num128[5] = result5 | 0;

}

// The algorithm below uses traditional long multiplication
// Result is returned in the first parameter num1
/*
            a3     a2    	a1      a0
	        b3     b2       b1      b0
                              b0 x a0
                      b0 x a1
             b0 x a23
                      b1 x a0
             b1 x a12
             b2 x a01
             b3 x a0
*/
function InplaceModMult64x64(int1: Uint64,
                              int2: Uint64): void  {

    const num1: Int32Array = int1.values;
    const num2: Int32Array = int2.values;

    const Mask: number = 0xFFFF | 0;

    let val;
    let val1;
    let val2;

    val = Math.imul(num2[0] | 0, num1[0] | 0) | 0;
    let result0: number = val & Mask;
    val1 = val >>> 16;

    val = Math.imul(num2[0] | 0, num1[1] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num2[1] | 0, num1[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result1: number = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;

    // leftmost, due to modulo, just let the product overflow
    val = (num1[3] << 16) | num1[2];
    val1 +=  Math.imul(num2[0] | 0, val | 0) | 0;
    val = (num1[2] << 16) | num1[1];
    val1 +=  Math.imul(num2[1] | 0, val | 0) | 0;
    val = (num1[1] << 16) | num1[0];
    val1 +=  Math.imul(num2[2] | 0, val | 0) | 0;

    let result2: number = val1 & Mask;
    val1 >>>= 16;

    // final one, special
    val1 +=  Math.imul(num2[3] | 0, num1[0] | 0);

    // in place results
    num1[0] = result0 | 0;
    num1[1] = result1 | 0;
    num1[2] = result2 | 0;
    num1[3] = val1 & Mask;

}

// result returned in first parameter
function InplaceModAdd128(
            int1: Uint64,
            int2: Uint64): void  {

    const num1: Int32Array = int1.values;
    const num2: Int32Array = int2.values;

    const Mask: number = 0xFFFF | 0;

    let val: number = num1[0] + num2[0];
    num1[0] = val & Mask;

    val >>>= 16;
    val += num1[1] + num2[1];
    num1[1] = val & Mask;

    val >>>= 16;
    val += num1[2] + num2[2];
    num1[2] = val & Mask;

    val >>>= 16;
    val += num1[3] + num2[3];
    num1[3] = val & Mask;

    val >>>= 16;
    val += num1[4] + num2[4];
    num1[4] = val & Mask;

    val >>>= 16;
    val += num1[5] + num2[5];
    num1[5] = val & Mask;

    // last bit, just let it overflow
    val >>>= 16;
    val += num1[6] + num2[6];
    num1[6] = val;

}

function Inplace64RightShift32Xor(int: Uint64): void {

    const num: Int32Array = int.values;

    num[0] ^= num[2];
    num[1] ^= num[3];
    // ^=0 is the same as no op
    // num[2] ^= 0;
    // num[3] ^= 0;
}

function Inplace64RightShift48Xor(int: Uint64): void {

    const num: Int32Array = int.values;

    num[0] ^= num[3];
    // ^=0 is the same as no op
    // num[1] ^= 0;
    // num[2] ^= 0;
    // num[3] ^= 0;
}