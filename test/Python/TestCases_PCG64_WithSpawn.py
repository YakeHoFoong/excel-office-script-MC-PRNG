# SPDX-FileCopyrightText: © 2023 Yake Ho Foong
# SPDX-License-Identifier: MIT

# This file is used for generating the unit test cases for the TypeScript library on:
# https://github.com/YakeHoFoong/excel-office-script-MC-PRNG

from numpy.random import Generator, PCG64DXSM, SeedSequence
from enum import Enum, unique
import numpy as np

@unique
class DistributionType(Enum):
    UNIT_UNIFORM = 1
    STANDARD_NORMAL = 2


TEST_ENTROPY = [int("b76a074c", 16), int("23c70376", 16), int("7710e1d7", 16), int("56f73ae9", 16)]

num_children = 10
pool_size = 4  # 4 is default
samples_per_child = 100
sg = SeedSequence(TEST_ENTROPY, pool_size=pool_size)
dist_type = DistributionType.STANDARD_NORMAL  # change to UNIT_UNIFORM for testing random variable in [0, 1)

investigating = False

print(f"Numpy version: {np.version.version}")

if not investigating:
    print("Use these settings in your TypeScript .spec.ts file:")
    print("Entropy used to create seed sequence:")
    print("[" + ", ".join([hex(x) for x in TEST_ENTROPY]) + "]")
    print(f"Pool size of seed sequence:\n{sg.pool_size}")
    print(f"Number of children spawned:\n{num_children}")
    print("Input the following test expected results into your TypeScript .spec.ts unit test files:")

for s in sg.spawn(num_children):
    r = Generator(PCG64DXSM(s))
    if dist_type is DistributionType.UNIT_UNIFORM:
        fn = r.random
    elif dist_type is DistributionType.STANDARD_NORMAL:
        fn = r.standard_normal
    else:
        raise Exception("You need to choose a type of random distribution");
    if investigating:
        bg = r.bit_generator
        x = bg.state
        print(x)
        y = x['state']
        myState = y['state']
        myInc = y['inc']
        print("Pulled state from Python:")
        print(hex(myState))
        print("Pulled inc from Python:")
        print(hex(myInc))
    if investigating:
        print("Pulled next raw from Python:")
        print(fn())
        print("Pulled next next raw from Python:")
        print(fn())
        print("==========")
    # print out for copying and pasting into JavaScript:
    if not investigating:
        results = [str(fn()) for i in range(samples_per_child)]
        print("[" + ", ".join(results) + "],")
