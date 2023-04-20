# SPDX-FileCopyrightText: © 2023 Yake Ho Foong
# SPDX-License-Identifier: MIT

from numpy.random import Generator, PCG64DXSM, SeedSequence  #, PCG64
import numpy as np

TEST_ENTROPY = [int("b76a074c", 16), int("23c70376", 16), int("7710e1d7", 16), int("56f73ae9", 16)]

print(f"Numpy version: {np.version.version}")

sg = SeedSequence(TEST_ENTROPY, pool_size=4)

for s in sg.spawn(3):
    r = Generator(PCG64DXSM(s))
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
    print("Pulled next raw from Python:")
    rraw = r.standard_normal()
    print(rraw)
    print("Pulled next next raw from Python:")
    rraw = r.standard_normal()
    print(rraw)
    print("==========")


print("========================================================================")
