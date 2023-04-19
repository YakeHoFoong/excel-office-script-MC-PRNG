// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
// a module to perform arithmetic for 128bit and 64bit integers
// for the random number generator
export { InplaceModMult128x64, InplaceModMult64x64, InplaceModAdd128, Inplace64RightShift32Xor, Inplace64RightShift48Xor };
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
function InplaceModMult128x64(num128, num64) {
    const Mask = 0xFFFF | 0;
    let val;
    let val1;
    let val2;
    val = Math.imul(num64[0] | 0, num128[0] | 0) | 0;
    let result0 = val & Mask;
    val1 = val >>> 16;
    val = Math.imul(num64[0] | 0, num128[1] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result1 = val1 & Mask;
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
    let result2 = val1 & Mask;
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
    let result3 = val1 & Mask;
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
    let result4 = val1 & Mask;
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
    let result5 = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;
    // leftmost, due to modulo, just let the product overflow
    val = num128[6] | 0; // special 32-bit word
    val1 += Math.imul(num64[0] | 0, val | 0) | 0;
    val = (num128[6] << 16) | num128[5];
    val1 += Math.imul(num64[1] | 0, val | 0) | 0;
    val = (num128[5] << 16) | num128[4];
    val1 += Math.imul(num64[2] | 0, val | 0) | 0;
    val = (num128[4] << 16) | num128[3];
    val1 += Math.imul(num64[3] | 0, val | 0) | 0;
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
function InplaceModMult64x64(num1, num2) {
    const Mask = 0xFFFF | 0;
    let val;
    let val1;
    let val2;
    val = Math.imul(num2[0] | 0, num1[0] | 0) | 0;
    let result0 = val & Mask;
    val1 = val >>> 16;
    val = Math.imul(num2[0] | 0, num1[1] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num2[1] | 0, num1[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    let result1 = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;
    // leftmost, due to modulo, just let the product overflow
    val = (num1[3] << 16) | num1[2];
    val1 += Math.imul(num2[0] | 0, val | 0) | 0;
    val = (num1[2] << 16) | num1[1];
    val1 += Math.imul(num2[1] | 0, val | 0) | 0;
    val = (num1[1] << 16) | num1[0];
    val1 += Math.imul(num2[2] | 0, val | 0) | 0;
    let result2 = val1 & Mask;
    val1 >>>= 16;
    // final one, special
    val1 += Math.imul(num2[3] | 0, num1[0] | 0);
    // in place results
    num1[0] = result0 | 0;
    num1[1] = result1 | 0;
    num1[2] = result2 | 0;
    num1[3] = val1 & Mask;
}
// result returned in first parameter
function InplaceModAdd128(num1, num2) {
    const Mask = 0xFFFF | 0;
    let val = num1[0] + num2[0];
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
function Inplace64RightShift32Xor(num) {
    num[0] ^= num[2];
    num[1] ^= num[3];
    // ^=0 is the same as no op
    // num[2] ^= 0;
    // num[3] ^= 0;
}
function Inplace64RightShift48Xor(num) {
    num[0] ^= num[3];
    // ^=0 is the same as no op
    // num[1] ^= 0;
    // num[2] ^= 0;
    // num[3] ^= 0;
}
//# sourceMappingURL=LongIntMaths.js.map