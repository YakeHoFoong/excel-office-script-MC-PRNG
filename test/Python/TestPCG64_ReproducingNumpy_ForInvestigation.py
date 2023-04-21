# SPDX-FileCopyrightText: © 2023 Yake Ho Foong
# SPDX-License-Identifier: MIT

from numpy.random import Generator, PCG64DXSM, SeedSequence, PCG64
import numpy as np

TEST_ENTROPY = [int("b76a074c", 16), int("23c70376", 16), int("7710e1d7", 16), int("56f73ae9", 16)]

print(f"Numpy version: {np.version.version}")

sg = SeedSequence(TEST_ENTROPY, pool_size=4)
r2 = Generator(PCG64DXSM(sg))
r = Generator(PCG64DXSM(sg))
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
rraw = r.bit_generator.random_raw()
print(hex(rraw))
print("Pulled next next raw from Python:")
rraw = r.bit_generator.random_raw()
print(hex(rraw))


zs = sg.generate_state(4, np.uint64)
xs = []
for i in range(len(zs)):
    xs.append(int(zs[i]))

hs = [hex(x)[2:] for x in xs]
hs2 = [hex(z)[2:] for z in zs]
print("From seed generate_state:")
print(', '.join(hs))
print(', '.join(hs2))
print("==========")

ss = bg._seed_seq
us = ss.generate_state(4, np.uint64)
hs3 = [hex(u)[2:] for u in us]
print(', '.join(hs3))
print("==========")

PCG_CHEAP_MULTIPLIER_128 = 0xda942042e4dd58b5
MASK_128 = 2 ** 128
MASK_64 = 2 ** 64
PCG_DEFAULT_MULTIPLIER_128 = 2549297995355413924 * MASK_64 + 4865540595714422341

class RangeDXSM:
    # constructor function
    def __init__(self, initstate, initseq):
        print("initstate:\n" + hex(initstate))
        print("initseq:\n" + hex(initseq))
        self.state = 0
        self.inc = (initseq << 1) | 1
        self.inc %= MASK_128
        print("inc:\n" + hex(self.inc))
        self.pcg_step_r()
        self.state %= MASK_128
        print("state 1:\n" + hex(self.state))
        self.state += initstate
        self.state %= MASK_128
        print("state 2:\n" + hex(self.state))
        self.pcg_step_r()
        self.state %= MASK_128
        print("state 3:\n" + hex(self.state))

        self.inc %= MASK_128
        self.state %= MASK_128

    def pcg_cm_step_r(self):
        self.state = self.state * PCG_CHEAP_MULTIPLIER_128 + self.inc

    def pcg_step_r(self):
        self.state = self.state * PCG_DEFAULT_MULTIPLIER_128 + self.inc

    def output_dxsm(self):
        hi = (self.state >> 64) % MASK_64
        lo = self.state % MASK_64
        lo |= 1
        hi ^= hi >> 32
        hi *= PCG_CHEAP_MULTIPLIER_128
        hi %= MASK_64
        hi ^= hi >> 48
        hi *= lo
        hi %= MASK_64
        return hi


initstate0 = xs[0] * MASK_64 + xs[1]
initseq0 = xs[2] * MASK_64 + xs[3]
rng = RangeDXSM(initstate0, initseq0)
print("My state:\n" + hex(rng.state))
print("My inc:\n" + hex(rng.inc))
print("My next raw:\n" + hex(rng.output_dxsm()))
rng.pcg_cm_step_r()
print("My next next raw:\n" + hex(rng.output_dxsm()))
print("Default constant:\n" + hex(PCG_DEFAULT_MULTIPLIER_128))