// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import {SeedSequence32} from "./SeedSequence32.mjs";

const TEST_ENTROPY = new Int32Array([0xb76a074c, 0x23c70376, 0x7710e1d7, 0x56f73ae9]);

// for printing during testing
function int32toBigInt(x)  {
    // this is to deal with the rightmost bit being treated as a special sign bit
    const lastBit = BigInt(x & 1);
    return ((BigInt(x >>> 1) << 1n) | lastBit);
}

let container = document.getElementById("container");

const mySeedSequence = new SeedSequence32(TEST_ENTROPY, [], 4);
const seqs = mySeedSequence.spawn(3);
for (const s of seqs)  {
    let xs = s.generateState(4);
    const result = [];
    xs.forEach((item) => {
        result.push(int32toBigInt(item).toString(16));
    });
    let content = document.createElement("span");
    content.innerHTML = result.join(', ') + "<br>";
    container.appendChild(content);
}



