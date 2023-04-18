"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SeedSequence32_1 = require("./SeedSequence32");
// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT
const TEST_ENTROPY = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);
// for printing during testing
function int32toBigInt(x) {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}
let container = document.getElementById("container");
if (container === null)
    throw Error("Could not find the div element with ID 'container'");
const mySeedSequence = new SeedSequence32_1.SeedSequence32(TEST_ENTROPY, new Int32Array(0), 4, 0);
const seqs = mySeedSequence.spawn(3);
for (const s of seqs) {
    let xs = s.generateState(4);
    const result = [];
    xs.forEach((item) => {
        result.push(int32toBigInt(item).toString(16));
    });
    let content = document.createElement("span");
    content.innerHTML = result.join(', ') + "<br>";
    container.appendChild(content);
}
//# sourceMappingURL=TestSeedSeq32.js.map