// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {ModMultUint128Uint64, ModAdd128} from "./LongIntMaths";
export {testLongMaths};

function int32toBigInt(x: number): bigint  {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit: bigint = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}

// for printing during testing
function intArrToBigInt(arr: Int32Array): bigint  {
    let result: bigint = 0n;
    for (let i : number = 0; i < arr.length; i++)  {
        result |= int32toBigInt(arr[i]) << BigInt(16 * i);
    }
    return result;
}

// for printing during testing
function bigIntToIntArr64(x: bigint): Int32Array  {
    const result: Int32Array = new Int32Array(4);
    for (const i in result) {
        result[i] = Number(x & 0xFFFFn);
        x >>= 16n;
    }
    return result;
}

// for printing during testing
function bigIntToIntArr128(x: bigint): Int32Array  {
    const result: Int32Array = new Int32Array(7);
    for (let i: number = 0; i < 6; i++) {
        result[i] = Number(x & 0xFFFFn);
        x >>= 16n;
    }
    result[6] = Number(x);  // last one is a 32-bit word
    return result;
}

function testLongMaths(): void {

    let container = document.getElementById("maths-test-result");
    if (container === null) throw Error("Could not find the div element with ID 'maths-test-result'");

    let testMul1: bigint = 0xa234f345090fbcdf290650968cae888dn
    let testMul2: bigint = 0x290809ce560989den

    let testAdd1: bigint = 0x6dbf895699a980568098bdbdf6378398n
    let testAdd2: bigint = 0x57806890a2343759890f8f345afead45n

    let content;
    let result: bigint;

    content = document.createElement("span");
    content.innerHTML = "First mult number: " + testMul1.toString(16) + "<br>";
    container.appendChild(content);
    content = document.createElement("span");
    content.innerHTML = "Second mult number: " + testMul2.toString(16) + "<br>";
    container.appendChild(content);
    result = (testMul1 * testMul2) % 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
    content = document.createElement("span");
    content.innerHTML = "Expected answer:<br>" + result.toString(16) + "<br>";
    container.appendChild(content);
    let calcResult: Int32Array = new Int32Array(7);
    ModMultUint128Uint64(bigIntToIntArr128(testMul1), bigIntToIntArr64(testMul2), calcResult);
    content = document.createElement("span");
    content.innerHTML = "Our answer:<br>" + intArrToBigInt(calcResult).toString(16) + "<br>";
    container.appendChild(content);

    content = document.createElement("span");
    content.innerHTML = "First add number: " + testAdd1.toString(16) + "<br>";
    container.appendChild(content);
    content = document.createElement("span");
    content.innerHTML = "Second add number: " + testAdd2.toString(16) + "<br>";
    container.appendChild(content);
    content = document.createElement("span");
    result = (testAdd1 + testAdd2) % 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
    content.innerHTML = "Expected answer:<br>" + result.toString(16) + "<br>";
    container.appendChild(content);
    calcResult = new Int32Array(7);
    ModAdd128(bigIntToIntArr128(testAdd1), bigIntToIntArr128(testAdd2), calcResult);
    content = document.createElement("span");
    content.innerHTML = "Our answer:<br>" + intArrToBigInt(calcResult).toString(16) + "<br>";
    container.appendChild(content);


}
