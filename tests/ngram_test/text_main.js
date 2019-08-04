const fs = require('fs');
const ngrams = require('./ngrams.js');

const inputFile = 'input.txt';
const inputText = fs.readFileSync(inputFile, 'utf8',
  (err, data) => { if (err) throw err; });
const word_list = inputText.split(/\s+/);

const clean_word_list = word_list;
for (let word in clean_word_list)
  clean_word_list[word] = clean_word_list[word].replace(/[^\u0041-\u007A\u00C0-\u00FF\u0100-\u1EF3 ]+/g, '').toLowerCase();

fs.writeFileSync(`ngram_output/word_list.json`, JSON.stringify(clean_word_list), (err) => {
  if (err) throw err;
});

const bigrams = new ngrams(2, word_list);
bigrams.output_gram_list();
bigrams.output_dist_list();

const trigrams = new ngrams(3, word_list);
trigrams.output_gram_list();
trigrams.output_dist_list();
