// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { RandomDistributions } from "../RandomDistributions.js";

import { PCG64DXSM } from "../PCG64DXSM.js";

export { JobSpec, JobResult, RandomDistribution };

const enum RandomDistribution {
  StandardNormal,
  UnitUniform,
}

interface JobResult {
  batchKey: string;
  streamNumber: number;
  numRows: number;
  numColumns: number;
  result: ArrayBuffer;
}

interface JobSpec {
  distribution: RandomDistribution;
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
  const numElements = jobSpec.numRows * jobSpec.numColumns;
  const floatArr = new Float64Array(numElements);
  switch (jobSpec.distribution) {
    case RandomDistribution.StandardNormal:
      for (let i = 0; i < numElements; i++) floatArr[i] = randDist.randomStandardNormal();
      break;
    case RandomDistribution.UnitUniform:
      for (let i = 0; i < numElements; i++) floatArr[i] = randDist.randomUnit();
      break;
    default:
      throw Error("Unknown random distribution type requested from worker.");
  }
  const message: JobResult = {
    batchKey: jobSpec.batchKey,
    streamNumber: jobSpec.streamNumber,
    numRows: jobSpec.numRows,
    numColumns: jobSpec.numColumns,
    result: floatArr.buffer,
  };
  // @ts-ignore
  // eslint-disable-next-line no-undef
  self.postMessage(message, [floatArr.buffer]);
});
