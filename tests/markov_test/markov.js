/**
 * @fileoverview This is a prototype of the markov chain module that will eventually be a part of the hardware_namegen
 *    project.
 */
const fs = require('fs');



class markov {
  /**
   * @param {number} order The order of the ngrams used in the markov chains
   */
  constructor (n, word_list) {
    this.n = n;
    this.ngrams = [];

    for (let itr_word of word_list) {
      itr_word = itr_word + '%'
      if (itr_word.length >= this.n)
        this.add_check('$', itr_word.substring(0,this.n));
      else
        break; // huh? Shouldn't this be 'continue'?
      for (let itr_n = 0; itr_n <= itr_word.length - this.n - 1; itr_n++) {
        let ngram = itr_word.substring(itr_n, itr_n + this.n);
        this.add_check(ngram, itr_word[itr_n + this.n]);
      }
    }
  }//end constructor

  add_check(ngram1, ngram2) {
    let found = false;
    let itr_check;

    for (itr_check in this.ngrams)
      if (this.ngrams[itr_check].ngram === ngram1) {
        found = true;
        break;
      }

    if (!found)
      this.ngrams.push({'ngram':ngram1, 'chains':[ngram2]});
    else
      this.ngrams[itr_check].chains.push(ngram2);
  }

  output_gram_list() {
    fs.writeFileSync(`markov_output/${this.n}grams.json`, JSON.stringify(this.ngrams), (err) => {
      if (err) throw err;
    });
  }

  generate(count) {
    for (let itr_count = 0; itr_count < count; itr_count++) {
      let gen_word = '$';
      while (gen_word[gen_word.length - 1] != '%') {
        if (gen_word === '$')
          for (let itr of this.ngrams)
            if (itr.ngram === '$')
              gen_word = gen_word + itr.chains[Math.floor(Math.random() * itr.chains.length)];
        else
          for (let itr of this.ngrams)
            if (itr.ngram === gen_word.substring(gen_word.length - this.n, gen_word.length))
              gen_word = gen_word + itr.chains[Math.floor(Math.random() * itr.chains.length)];
      }
      console.log(gen_word.substring(1,gen_word.length - 1))
    }
  }

}

module.exports = markov;

/*
class markov {

  // create an object that stores markov chains of ngrams from the min order to the max order
  constructor(max_n, markov_word_list) {

    this.markov_chains = [];

    for (let itr_word of markov_word_list) {
      for (let itr_n = 1; itr_n >= max_n; itr_n++) {
        let found = false;
        for (itr_Mchain of this.markov_chains.ngram) {
          if (itr_Mchain === itr_word)
            found
        }
      }
    }
    // loop through the given word list
    // do it (max) times, once for each order in the given range

    // for each order and for each ngram found
    // if it is new, add it to an array as a new object with both the ngram stored and an array of ngrams
    // also store the ngrams of each order, afterward, within reason
    // * obviously you can't store beyond the length remaining in the string
    // if it is old, simply add the character afterward to the array in the object
    // also keep track of the beginning of strings as well as the end of strings as markov chains
  }

  // may need to use placeholders for beginning of string and end of string

  // generates n strings using the markov chains
  generate (n, file = '') {
    // insert a beginning string
    // place a random ngram within the max range
    // continue to select a random length of the existing string within the max range until an "end of string" is hit
    // do this (n) times
    // output to a file of the given name, if no file name is given, then skip this step
  }

  // what happens if it takes too long to reach end of strings and the strings become ridiculous?
  // * perhaps I don't need to adjust for this and the nature of Markov chains will sort this out naturally
  //   if not, however, I'll implement some way for the markov chains to weigh their way towards end of strings

  // do I want to implement a text and word level version of this separately, or as a part of this module?

}*/
