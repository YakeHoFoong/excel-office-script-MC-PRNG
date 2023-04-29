// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { RandomDistributions } from "../RandomDistributions.js";

import { PCG64DXSM } from "../PCG64DXSM.js";

export { JobSpec, JobResult };

interface JobResult {
  batchKey: string;
  streamNumber: number;
  result: number[][] | string;
}

interface JobSpec {
  batchKey: string;
  streamNumber: number;
  numRows: number;
  numColumns: number;
  seqSeeds: Int32Array;
}

// eslint-disable-next-line no-undef
self.addEventListener("message", function (event) {
  const jobSpec: JobSpec = event.data;
  const bitGen = new PCG64DXSM(jobSpec.seqSeeds);
  const randDist = new RandomDistributions(bitGen);
  const result = new Array<number[]>(0);
  for (let r = 0; r < jobSpec.numRows; r++) {
    result[r] = new Array<number>(jobSpec.numColumns);
    for (let c = 0; c < jobSpec.numColumns; c++) {
      result[r][c] = randDist.randomStandardNormal();
    }
  }
  const message: JobResult = { batchKey: jobSpec.batchKey, streamNumber: jobSpec.streamNumber, result: result };
  // eslint-disable-next-line no-undef
  postMessage(message);
});
