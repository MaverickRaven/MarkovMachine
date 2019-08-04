const fs = require('fs');

class ngrams {

  constructor (n, ngram_word_list) {
    this.n = n;
    this.gram_list = [];
    this.dist_list = [];

    // Loop through the input array and create an array of every ngram
    for (let itr_word of ngram_word_list) {
      for (let itr_char = 0; itr_char < itr_word.length - (n - 1); itr_char++)
        this.gram_list.push(itr_word.substring(itr_char, itr_char + n));
    }

    //console.log(this.gram_list);

    // loop through the ngram array and tally the distribution of the various ngrams
    for (let itr_gram of this.gram_list) {
      let found = false;
      let index = null;
      for (let itr in this.dist_list) {
        if (itr_gram === this.dist_list[itr].gram) {
          found = true;
          index = itr;
          break;
        }
      }
      if (found)
        this.dist_list[index].count++;
      else
        this.dist_list.push({'gram': itr_gram,'count': 1});
    }
  }//end constructor

  //helper function for order the distribution from greatest frequency to least
  ngram_sort() {

  }

  //outputs a file for the ngrams of a particular range
  output_gram_list() {
    fs.writeFileSync(`ngram_output/${this.n}grams.json`, JSON.stringify(this.gram_list), (err) => {
      if (err) throw err;
    });
  }

  output_dist_list() {
    fs.writeFileSync(`ngram_output/${this.n}gram_distrbution.json`, JSON.stringify(this.dist_list), (err) => {
      if (err) throw err;
    });
  }

}

module.exports = ngrams;
