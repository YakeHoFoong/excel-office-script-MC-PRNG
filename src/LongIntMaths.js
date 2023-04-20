// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
// This module contain functions that perform arithmetic
// for 128bit and 64bit integers for the random number generators.
// Currently only implemented those needed for the PCG64-DXSM generator.
export { int32toBigInt, Uint64, Uint128 };
// mainly for testing
function int32toBigInt(x) {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}
function int32toNumber(x) {
    if (x < 0)
        return (x & 0x7FFFFFFF) + 0x80000000;
    return x;
}
class Uint64 {
    constructor() {
        this.values = new Int32Array(4);
    }
    // during random number generation
    copyFrom(num) {
        this.values.set(num.values);
    }
    // for constructing from the seeds
    from32bits(num1, num2) {
        const mask = 0xFFFF;
        const values = this.values;
        values[0] = num1 & mask;
        values[1] = num1 >>> 16;
        values[2] = num2 & mask;
        values[3] = num2 >>> 16;
    }
    to32bits(numPair) {
        const values = this.values;
        numPair.num1 = int32toNumber((values[1] << 16) | values[0]);
        numPair.num2 = int32toNumber((values[3] << 16) | values[2]);
    }
    // mainly used for testing only
    fromBigint(x) {
        for (let i = 0; i < 4; i++) {
            this.values[i] = Number(x & 0xffffn);
            x >>= 16n;
        }
    }
    // mainly used for testing only
    toBigInt() {
        let result = 0n;
        const arr = this.values;
        for (let i = 0; i < arr.length; i++) {
            result |= int32toBigInt(arr[i]) << BigInt(16 * i);
        }
        return result;
    }
    // The algorithm below uses traditional long multiplication
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
    inplaceModMult64x64(int2) {
        const num1 = this.values;
        const num2 = int2.values;
        const mask = 0xFFFF | 0;
        let val;
        let val1;
        let val2;
        val = Math.imul(num2[0] | 0, num1[0] | 0) | 0;
        let result0 = val & mask;
        val1 = val >>> 16;
        val = Math.imul(num2[0] | 0, num1[1] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num2[1] | 0, num1[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result1 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        // leftmost, due to modulo, just let the product overflow
        val = (num1[3] << 16) | num1[2];
        val1 += Math.imul(num2[0] | 0, val | 0) | 0;
        val = (num1[2] << 16) | num1[1];
        val1 += Math.imul(num2[1] | 0, val | 0) | 0;
        val = (num1[1] << 16) | num1[0];
        val1 += Math.imul(num2[2] | 0, val | 0) | 0;
        let result2 = val1 & mask;
        val1 >>>= 16;
        // final one, special
        val1 += Math.imul(num2[3] | 0, num1[0] | 0);
        // in place results
        num1[0] = result0 | 0;
        num1[1] = result1 | 0;
        num1[2] = result2 | 0;
        num1[3] = val1 & mask;
    }
    inplace64RightShift32Xor() {
        const num = this.values;
        num[0] ^= num[2];
        num[1] ^= num[3];
        // ^=0 is the same as no op
        // num[2] ^= 0;
        // num[3] ^= 0;
    }
    inplace64RightShift48Xor() {
        const num = this.values;
        num[0] ^= num[3];
        // ^=0 is the same as no op
        // num[1] ^= 0;
        // num[2] ^= 0;
        // num[3] ^= 0;
    }
}
class Uint128 {
    constructor() {
        this.high64 = new Uint64();
        this.low64 = new Uint64();
    }
    fromBigint(x) {
        this.high64.fromBigint(x >> 64n);
        this.low64.fromBigint(x & 0xffffffffffffffffn);
    }
    // mainly used for testing only
    toBigInt() {
        return (this.high64.toBigInt() << 64n)
            | this.low64.toBigInt();
    }
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
    inplaceModMult128x64(int64) {
        const mask = 0xFFFF | 0;
        let val;
        let val1;
        let val2;
        const num128hi = this.high64.values;
        const num128lo = this.low64.values;
        const num64 = int64.values;
        val = Math.imul(num64[0] | 0, num128lo[0] | 0) | 0;
        let result0 = val & mask;
        val1 = val >>> 16;
        val = Math.imul(num64[0] | 0, num128lo[1] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num64[1] | 0, num128lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result1 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num64[0] | 0, num128lo[2] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num64[1] | 0, num128lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[2] | 0, num128lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result2 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num64[0] | 0, num128lo[3] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num64[1] | 0, num128lo[2] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[2] | 0, num128lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[3] | 0, num128lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result3 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num64[0] | 0, num128hi[0] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num64[1] | 0, num128lo[3] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[2] | 0, num128lo[2] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[3] | 0, num128lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result4 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num64[0] | 0, num128hi[1] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num64[1] | 0, num128hi[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[2] | 0, num128lo[3] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num64[3] | 0, num128lo[2] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result5 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        // leftmost, due to modulo, just let the product overflow
        val = (num128hi[3] << 16) | num128hi[2];
        val1 += Math.imul(num64[0] | 0, val | 0) | 0;
        val = (num128hi[2] << 16) | num128hi[1];
        val1 += Math.imul(num64[1] | 0, val | 0) | 0;
        val = (num128hi[1] << 16) | num128hi[0];
        val1 += Math.imul(num64[2] | 0, val | 0) | 0;
        val = (num128hi[0] << 16) | num128lo[3];
        val1 += Math.imul(num64[3] | 0, val | 0) | 0;
        // fill in the in place results
        num128lo[0] = result0 | 0;
        num128lo[1] = result1 | 0;
        num128lo[2] = result2 | 0;
        num128lo[3] = result3 | 0;
        num128hi[0] = result4 | 0;
        num128hi[1] = result5 | 0;
        num128hi[2] = val1 & mask;
        num128hi[3] = val1 >>> 16;
    }
    // The algorithm below uses traditional long multiplication
    /*
        a7     a6   	 a5     a4    	a3     a2    	a1      a0
        b7     b6        b5     b4      b3     b2       b1      b0
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
                             b4 x a0
                    b4 x a1
         b4 x a32
                    b5 x a0
         b5 x a12
         b6 x a01
    b7 x a0
    */
    inplaceModMult128x128(int128) {
        const mask = 0xFFFF | 0;
        let val;
        let val1;
        let val2;
        const num1hi = this.high64.values;
        const num1lo = this.low64.values;
        const num2lo = int128.low64.values;
        const num2hi = int128.high64.values;
        val = Math.imul(num2lo[0] | 0, num1lo[0] | 0) | 0;
        let result0 = val & mask;
        val1 = val >>> 16;
        val = Math.imul(num2lo[0] | 0, num1lo[1] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num2lo[1] | 0, num1lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result1 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num2lo[0] | 0, num1lo[2] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num2lo[1] | 0, num1lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[2] | 0, num1lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result2 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num2lo[0] | 0, num1lo[3] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num2lo[1] | 0, num1lo[2] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[2] | 0, num1lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[3] | 0, num1lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result3 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num2lo[0] | 0, num1hi[0] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num2lo[1] | 0, num1lo[3] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[2] | 0, num1lo[2] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[3] | 0, num1lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2hi[0] | 0, num1lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result4 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        val = Math.imul(num2lo[0] | 0, num1hi[1] | 0) | 0;
        val1 += val & mask;
        val2 = val >>> 16;
        val = Math.imul(num2lo[1] | 0, num1hi[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[2] | 0, num1lo[3] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2lo[3] | 0, num1lo[2] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2hi[0] | 0, num1lo[1] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        val = Math.imul(num2hi[1] | 0, num1lo[0] | 0) | 0;
        val1 += val & mask;
        val2 += val >>> 16;
        let result5 = val1 & mask;
        val1 = (val2 + (val1 >>> 16)) | 0;
        // leftmost, due to modulo, just let the product overflow
        val = (num1hi[3] << 16) | num1hi[2];
        val1 += Math.imul(num2lo[0] | 0, val | 0) | 0;
        val = (num1hi[2] << 16) | num1hi[1];
        val1 += Math.imul(num2lo[1] | 0, val | 0) | 0;
        val = (num1hi[1] << 16) | num1hi[0];
        val1 += Math.imul(num2lo[2] | 0, val | 0) | 0;
        val = (num1hi[0] << 16) | num1lo[3];
        val1 += Math.imul(num2lo[3] | 0, val | 0) | 0;
        // part 2
        val = (num1lo[3] << 16) | num1lo[2];
        val1 += Math.imul(num2hi[0] | 0, val | 0) | 0;
        val = (num1lo[2] << 16) | num1lo[1];
        val1 += Math.imul(num2hi[1] | 0, val | 0) | 0;
        val = (num1lo[1] << 16) | num1lo[0];
        val1 += Math.imul(num2hi[2] | 0, val | 0) | 0;
        // save result
        let result6 = val1 & mask;
        val1 >>>= 16;
        // final one, special
        val1 += Math.imul(num2hi[3] | 0, num1lo[0] | 0);
        // fill in the in place results
        num1lo[0] = result0 | 0;
        num1lo[1] = result1 | 0;
        num1lo[2] = result2 | 0;
        num1lo[3] = result3 | 0;
        num1hi[0] = result4 | 0;
        num1hi[1] = result5 | 0;
        num1hi[2] = result6 | 0;
        num1hi[3] = val1 & mask;
    }
    inplaceModAdd128(int2) {
        const num1lo = this.low64.values;
        const num1hi = this.high64.values;
        const num2lo = int2.low64.values;
        const num2hi = int2.high64.values;
        const mask = 0xFFFF | 0;
        let val = num1lo[0] + num2lo[0];
        num1lo[0] = val & mask;
        val >>>= 16;
        val += num1lo[1] + num2lo[1];
        num1lo[1] = val & mask;
        val >>>= 16;
        val += num1lo[2] + num2lo[2];
        num1lo[2] = val & mask;
        val >>>= 16;
        val += num1lo[3] + num2lo[3];
        num1lo[3] = val & mask;
        val >>>= 16;
        val += num1hi[0] + num2hi[0];
        num1hi[0] = val & mask;
        val >>>= 16;
        val += num1hi[1] + num2hi[1];
        num1hi[1] = val & mask;
        val >>>= 16;
        val += num1hi[2] + num2hi[2];
        num1hi[2] = val & mask;
        val >>>= 16;
        val += num1hi[3] + num2hi[3];
        num1hi[3] = val & mask;
    }
    inplaceMod128LeftShift1or1() {
        const numLo = this.low64.values;
        const numHi = this.high64.values;
        const mask = 0xFFFF | 0;
        const cutOff = 0x7FFF | 0;
        const carryLo0 = numLo[0] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        const carryLo1 = numLo[1] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        const carryLo2 = numLo[2] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        const carryLo3 = numLo[3] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        const carryHi0 = numHi[0] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        const carryHi1 = numHi[1] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        const carryHi2 = numHi[2] > (cutOff | 0) ? 1 | 0 : 0 | 0;
        numLo[0] = ((numLo[0] << 1) & mask) | 1;
        numLo[1] = ((numLo[1] << 1) & mask) | carryLo0;
        numLo[2] = ((numLo[2] << 1) & mask) | carryLo1;
        numLo[3] = ((numLo[3] << 1) & mask) | carryLo2;
        numHi[0] = ((numHi[0] << 1) & mask) | carryLo3;
        numHi[1] = ((numHi[1] << 1) & mask) | carryHi0;
        numHi[2] = ((numHi[2] << 1) & mask) | carryHi1;
        numHi[3] = ((numHi[3] << 1) & mask) | carryHi2;
    }
}
//# sourceMappingURL=LongIntMaths.js.map