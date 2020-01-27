# MarkovMachine
A markov chain-based name generator

## Features
* works with input data at the character-level
* ngram data generation to the nth order
* markov chain generation within a given range
* procedural generation of names based on the current markov chain
  * can specify a minimum and maximum string length for better results
  * filters repeats of existing strings
* stores any output as a .json file
* imports data from text files or using a simple .json schema

Dependencies:
* ajv
