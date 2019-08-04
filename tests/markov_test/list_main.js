const fs = require('fs');
const markov = require('./markov.js');

const inputFile = 'C:/Workspace/name_scraper/name_lists/names_ancient_greek.json';
const word_list = JSON.parse(fs.readFileSync(inputFile,
  (err, data) => { if (err) throw err; }));

const clean_word_list = word_list;
for (let word in clean_word_list)
  clean_word_list[word] = clean_word_list[word].replace(/[^\u0041-\u007A\u00C0-\u00FF\u0100-\u1EF3 ]+/g, '').toLowerCase();

fs.writeFileSync(`markov_output/word_list.json`, JSON.stringify(clean_word_list), (err) => {
  if (err) throw err;
});

const m_chain = new markov(4, word_list);
m_chain.output_gram_list();
m_chain.generate(50);
