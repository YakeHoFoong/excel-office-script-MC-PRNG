# SPDX-FileCopyrightText: © 2023 Yake Ho Foong
# SPDX-License-Identifier: MIT

from numpy.random import Generator, PCG64DXSM, SeedSequence
import numpy as np

TEST_ENTROPY = [int("b76a074c", 16), int("23c70376", 16), int("7710e1d7", 16), int("56f73ae9", 16)]

print(f"Numpy version: {np.version.version}")

sg = SeedSequence(TEST_ENTROPY, pool_size=4)
rg = [Generator(PCG64DXSM(s)) for s in sg.spawn(10)]

for r in rg:
    nums = ['{:.8f}'.format(r.random()) for i in range(3)]
    print(', '.join(nums))



