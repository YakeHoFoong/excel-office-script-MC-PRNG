// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
// a module to perform arithmetic for 128bit and 64bit integers
// for the random number generator
export { ModMultUint128Uint64, ModAdd128 };
// 128-bit (64-bit) integer is represented by 7 (4) 32-bit words,
// but each is only filled with a 16-bit number, except for
// the leftmost, which is a 32-bit number.
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
function ModMultUint128Uint64(num128, num64, product64) {
    const Mask = 0xFFFF | 0;
    let val;
    let val1;
    let val2;
    val = Math.imul(num64[0] | 0, num128[0] | 0) | 0;
    product64[0] = val & Mask;
    val1 = val >>> 16;
    val = Math.imul(num64[0] | 0, num128[1] | 0) | 0;
    val1 += val & Mask;
    val2 = val >>> 16;
    val = Math.imul(num64[1] | 0, num128[0] | 0) | 0;
    val1 += val & Mask;
    val2 += val >>> 16;
    product64[1] = val1 & Mask;
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
    product64[2] = val1 & Mask;
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
    product64[3] = val1 & Mask;
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
    product64[4] = val1 & Mask;
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
    product64[5] = val1 & Mask;
    val1 = (val2 + (val1 >>> 16)) | 0;
    // leftmost, due to modulo, just let the product overflow
    val = num128[6]; // special 32-bit word
    val1 += Math.imul(num64[0] | 0, val | 0) | 0;
    val = (num128[6] << 16) | num128[5];
    val1 += Math.imul(num64[1] | 0, val | 0) | 0;
    val = (num128[5] << 16) | num128[4];
    val1 += Math.imul(num64[2] | 0, val | 0) | 0;
    val = (num128[4] << 16) | num128[3];
    val1 += Math.imul(num64[3] | 0, val | 0) | 0;
    product64[6] = val1;
}
function ModAdd128(num1, num2, result) {
    const Mask = 0xFFFF | 0;
    let val = num1[0] + num2[0];
    result[0] = val & Mask;
    val >>>= 16;
    val += num1[1] + num2[1];
    result[1] = val & Mask;
    val >>>= 16;
    val += num1[2] + num2[2];
    result[2] = val & Mask;
    val >>>= 16;
    val += num1[3] + num2[3];
    result[3] = val & Mask;
    val >>>= 16;
    val += num1[4] + num2[4];
    result[4] = val & Mask;
    val >>>= 16;
    val += num1[5] + num2[5];
    result[5] = val & Mask;
    // last bit, just let it overflow
    val >>>= 16;
    val += num1[6] + num2[6];
    result[6] = val;
}
//# sourceMappingURL=LongIntMaths.js.map