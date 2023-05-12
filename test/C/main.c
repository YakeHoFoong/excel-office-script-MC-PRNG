/* SPDX-FileCopyrightText: © 2023 Yake Ho Foong */
/* SPDX-License-Identifier: MIT */

#include <stdio.h>
#include <inttypes.h>
#include "xoshiro256plusplus.c"

int main() {
    static uint64_t s0[4];
    /* initialize the state, see file SeedSequence32.spec.ts */
    s[0] = s0[0] = 0xb5bb44b2f431cc88;
    s[1] = s0[1] = 0xe3977bacb2e89874;
    s[2] = s0[2] = 0xb18b61e29d0ba2f2;
    s[3] = s0[3] = 0x2480e33bf72adfa6;

    for (int c = 0; c < 3; c++) {
        /* reset state to start */
        for (int i = 0; i < 4; i++) s[i] = s0[i];
        int j = 0;
        if (c > 0) {
            next();
            next();
            while (j++ < c) {
                jump();
            }
        }
        printf("State:\n");
        for (int i = 0; i < 4; i++) printf("%" PRIx64 "\n", s[i]);
        /* skip 2 */
        next();
        next();
        printf("Results in hexadecimal:\n");
        for (int i = 0; i < 2; i++) {
            uint64_t result = next();
            printf("%" PRIx64 "\n", result);
        }
        jump();
    }

    /* give an update */
    printf("Finished!!\n");
    return 0;
}
