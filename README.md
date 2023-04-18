SPDX-FileCopyrightText: © 2023 Yake Ho Foong
SPDX-License-Identifier: MIT

# High-quality Pseudorandom Number Generators (PRNG) in Excel Office Script for Monte Carlo (MC) Simulations
This project aims to replicate in Excel Office Script publicly available PRNGs for MC simulations. Of the popular ones, Python's Numpy has the PCR64 DXSM-variation generator, while Java has the LXM class generators and the Xoshiro256++ generator. Initially, I will focus on only replicating the Python Numpy's PCR64 DXSM in this project. I will not attempt to build the Mersenne Twister in this project as it is less modern than the others and also more complicated to code.

# What problem are we trying to solve?
A common issue when using Excel to perform Monte Carlo simulations (using the **TABLE** function) is that there is no built-in way to reproduce the pseudorandom numbers because:
* Excel's **RAND** function is of high-quality (Mersenne Twister since Excel 2010) but it does not accept a seed, so every run is a new set of pseudorandom numbers (seeded by some system input that the user cannot specify).
* VBA's **rnd** function takes a seed as input, and hence can reproduce a set or series of pseudorandom numbers, but its underlying algorithm is simply a linear congruential generator (LCG); hence, it is not suitable for use in Monte Carlo simulations, as the quality is low (and hence there is a non-negligible risk of repeated or correlated series of pseudorandom numbers).

There are third-party tools such as VBA code that implements the Mersenne Twister, but since Office on the Web is moving away from VBA and into Office Script for security reasons, I see this project as a useful tool to have for Monte Carlo simulations in Excel.

# Final Goal
My final goal is to write an add-in in Office Script (TypeScript) and share it on Microsoft's AppSource so that anyone can easily get it and use it.

Online resource:
https://learn.microsoft.com/en-us/office/dev/add-ins/develop/yeoman-generator-overview