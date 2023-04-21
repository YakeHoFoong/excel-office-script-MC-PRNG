# SPDX-FileCopyrightText: © 2023 Yake Ho Foong
# SPDX-License-Identifier: MIT

import numpy as np
import numpy.version

TEST_ENTROPY = [int("b76a074c", 16), int("23c70376", 16), int("7710e1d7", 16), int("56f73ae9", 16)]

print(f"Numpy version: {numpy.version.version}")

for c in np.random.SeedSequence(TEST_ENTROPY, pool_size=4).spawn(3):
    xs = c.generate_state(4)
    hs = [hex(x)[2:] for x in xs]
    print(', '.join(hs))
