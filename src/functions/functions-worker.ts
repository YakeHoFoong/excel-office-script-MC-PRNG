// SPDX-FileCopyrightText: © 2023 Yake Ho Foong
// SPDX-License-Identifier: MIT

import { RandomDistributions } from "../RandomDistributions.js";

import { PCG64DXSM } from "../PCG64DXSM.js";
import { IRandomBitsGenerator } from "../RandomInterface.js";
import { Xoshiro256PlusPlus } from "../Xoshiro256PlusPlus.js";

export { JobSpec, JobResult, RandomDistributionEnum, BitGeneratorEnum };

const enum BitGeneratorEnum {
  PCG64DXSM,
  Xoshiro256PlusPlus,
}

const enum RandomDistributionEnum {
  StandardNormal,
  UnitUniform,
}

interface JobResult {
  streamSetKey: string;
  streamNumber: number;
  numRows: number;
  numColumns: number;
  result: ArrayBuffer;
}

interface JobSpec {
  bitGenType: BitGeneratorEnum;
  distribution: RandomDistributionEnum;
  batchKey: string;
  numRows: number;
  numColumns: number;
  streamNumber: number;
  initialState: Int32Array;
}

// eslint-disable-next-line no-undef
self.addEventListener("message", function (event) {
  const jobSpec: JobSpec = event.data;
  let bitGen: IRandomBitsGenerator;
  switch (jobSpec.bitGenType) {
    case BitGeneratorEnum.PCG64DXSM:
      bitGen = new PCG64DXSM(jobSpec.initialState);
      break;
    case BitGeneratorEnum.Xoshiro256PlusPlus:
      bitGen = new Xoshiro256PlusPlus(jobSpec.initialState);
      break;
    default:
      throw Error("Unknown bit generator requested from worker.");
  }
  const randDist = new RandomDistributions(bitGen);
  const numElements = jobSpec.numRows * jobSpec.numColumns;
  const floatArr = new Float64Array(numElements);
  switch (jobSpec.distribution) {
    case RandomDistributionEnum.StandardNormal:
      for (let i = 0; i < numElements; i++) floatArr[i] = randDist.randomStandardNormal();
      break;
    case RandomDistributionEnum.UnitUniform:
      for (let i = 0; i < numElements; i++) floatArr[i] = randDist.randomUnit();
      break;
    default:
      throw Error("Unknown random distribution type requested from worker.");
  }
  const message: JobResult = {
    streamSetKey: jobSpec.batchKey,
    streamNumber: jobSpec.streamNumber,
    numRows: jobSpec.numRows,
    numColumns: jobSpec.numColumns,
    result: floatArr.buffer,
  };
  // @ts-ignore
  // eslint-disable-next-line no-undef
  self.postMessage(message, [floatArr.buffer]);
});
