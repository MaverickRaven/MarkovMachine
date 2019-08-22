const path = require('path');
const fs = require('fs');

const WORD_END = '%', // '%' is the arbitrarily chosen end-of-word marker &
  WORD_START = '$'; // '$' is the start-of-word marker. They simplify generation of chains and new words ('$' is not actually used, but leaving here for now...)

class MarkovData {
  /* Base class that all but MarkovDataObjects inherit from
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovContainer and MarkovChain classes
   */
  constructor() {
    this.type = 'Markov_Data';
    this.level = 'character';
  }

  ngramRaw( order ) { // should 'order' default to an order of 2?
    /* outputs an array of every ngram of the given order
     * n-<Number>: designates the order for the ngrams (length based on units)
     */
    let ngramList = []; // stores every instance of every ngram
    for ( let itrWord of this.list ) {
      for ( let itrChar = 0; itrChar < itrWord.length - ( order - 1 ); itrWord++ ) {
        ngramList.push( itrWord.substring( itrChar, itrChar + order ));
      }
    }
    return ngramList;
  }

  ngramDistribution( order ) {
    /* outputs a tidy array of objects, one for each ngram,
     * as well as a tally of the total number of occurences for each one
     * n-<Number>: designates the order for the ngrams (length based on units)
     */
    let ngramList = this.ngramRaw( order ),
      distList = []; // stores distribution of ngrams

    for ( let itrGram of ngramList ) {
      let finder = distList.findIndex( itr => {
        return itr.ngram === itrGram;
      });
      if ( finder !== -1 ) {
        distList[ finder ].count++;
      } else {
        distList.push({'ngram': itrGram,'count': 1 });
      }
    }
    distList = distList.sort(( a, b ) => {
      return b.count - a.count; // ascending order
    });
    return distList;
  }

  shortestItem() {
    let temp = this.list.sort(( a, b ) => {
      return a.length - b.length;
    });
    return temp[0].length;
  }

  longestItem() {
    let temp = this.list.sort(( a, b ) => {
      return b.length - a.length;
    });
    return temp[0].length;
  }

  allCaps() {
    for ( let itrString in this.list ) {
      this.list[itrString] = this.list[itrString].toUpperCase();
    }
  }
}

class ArrayData extends MarkovData {
  /* Accepts an array
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovContainer and MarkovChain classes
   */
  constructor( input ) { //this needs to be restructured, that if else structure is a mess
    super();
    this.list = [];
    if ( !Array.isArray( input )) {
      throw new Error("Invalid MarkovData input!");
    } else if ( typeof input[0] === 'string' ) {
      this.list = input;
    } else {
      for ( let itr in input ) {
        if ( Array.isArray( itr )) {
          this.list = this.list.concat( itr );
        } 
      }
    }
    this.allCaps();
  }
}

class JSONArrayData extends MarkovData {
  /* Accepts a .json file containing only an array of strings
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovContainer and MarkovChain classes
   */
  constructor( input ) {
    super();
    this.list = [];
    if ( Array.isArray( input )) {
      for ( let itr of input ) {
        if ( typeof itr === 'string' && path.isAbsolute( itr ) && path.extname( itr ) === '.json') {
          let temp = JSON.parse( fs.readFileSync( itr,'utf8', err => {
            if (err) throw err;
          }));
          if ( !Array.isArray( temp )) {
            throw new Error("Improperly formatted .json file!");
          } else if ( this.list.length === 0 ) {
            this.list = temp;
          } else {
            this.list = this.list.concat( temp );
          }
        } else {
          throw new Error("Invalid MarkovData input!");
        }
      }
    } else if (typeof input === 'string' && path.isAbsolute( input ) && path.extname( input ) === '.json') {
      let temp = JSON.parse( fs.readFileSync( input,'utf8', err => {
        if (err) throw err;
      }));
      if ( !Array.isArray( temp )) {
        throw new Error("Improperly formatted .json file!");
      } else {
        this.list = temp;
      }
    } else {
      throw new Error("Invalid MarkovData input!");
    }
    this.allCaps();
  }
}

class TextListData extends MarkovData {
  /* Accepts a .txt file with entries separated by a \n character
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovContainer and MarkovChain classes
   */
  constructor( input ) {
    super();
    if ( Array.isArray( input )) {
      for ( let itr of input ) {
        if ( typeof itr === 'string' && path.isAbsolute( itr ) && path.extname( itr ) === '.txt' ) { // check for valid .txt file
          this.list = this.list + fs.readFileSync( itr, 'utf8', err => {
            if (err) throw err;
          }).split('\n');
        } else {
          throw new Error("Invalid MarkovData input!");
        }
      }
    } else if ( typeof input === 'string' && path.isAbsolute( input ) && path.extname( input ) === '.txt' ) { // check for valid .txt file
      this.list = fs.readFileSync( input, 'utf8', err => {
        if (err) throw err;
      }).split('\n');
    } else {
      throw new Error("Invalid MarkovData input!");
    }
    this.allCaps();
  }
}

class TextStringData extends MarkovData {
  /* Accepts a text file containing prose
   * Works at the word level
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovContainer and MarkovChain classes
   */
  constructor( input ) {
    super();
    this.level = 'word';
  }
}

class StringData extends MarkovData {
  /* Accepts a single string in either a text file, string literal or string variable cotnaining prose
   * Has functions that are used to generate ngrams for analysis.
   * Intended for use with the MarkovContainer and MarkovChain classes.
   * input=<String>: the file or array of strings that is used to generate markov chains
   */
  constructor( input ) {
    super();
    this.level = 'word';
  }
}

class DataChain {
  /* Accepts a MarkovData object and creates a markov chain from the data contained within
   * of the specified order (number of elements per ngram).
   */
  constructor( markovData, order ) {
    this.order = order;
    this.initialNgrams = [];
    this.chains = [];

    for ( let itrWord of markovData.list ) {
      if ( itrWord.length <= order ) { // skip this word if it's too short
        console.log(`Skipped ${itrWord}: word is beyond given order range of ${this.order}`);
        continue;
      }
      itrWord += WORD_END; // appends char used to mark the end of chain
      this.initialNgrams.push( itrWord.substring( 0, this.order )); // we want to store every initialNgram, even repeats
      for ( let itrChar = 0; itrChar <= itrWord.length - (this.order + 1); itrChar++ ) {
        let ngram = itrWord.substring( itrChar, itrChar + this.order );
        let finder = this.chains.findIndex( itr => {
          return itr.ngram === ngram;
        });
        if ( finder !== -1 ) {
          this.chains[ finder ].nextChars.push( itrWord[ itrChar + this.order ]);
        } else {
          this.chains.push({'ngram':ngram, 'nextChars': [ itrWord[ itrChar + this.order ]]})
        }
      }
      itrWord.name = itrWord.name.substring( 0, itrWord.name.length - 1 );
    }
    if ( !this.chains.length ) {
      throw new Error(`This MarkovData yields no chain given an order of ${this.order}`);
    } else {
      this.chains.sort(( a, b ) => { // sort each chain alphabetically based on the initial ngram
        return ( a.ngram ).localeCompare( b.ngram );
      });
    }
  }
}

class DataContainer {
  /* 
   * 
   */
  constructor( markovData ) {
    if ( markovData.type !== "Markov_Data" ) {
      throw new Error("Invalid MarkovData input!")
    }
    this.markovData = markovData;
  }

  lowestOrder( chains ) { // truthfully, I'm not exactly sure how these two functions work... or even if they work...
    // returns the lowest order found among a list of chains (typically as output by generate chains)
    return chains.reduce( ( min, p ) => p.order < min ? p.order : min, chains[0].order );
  }

  highestOrder( chains ) {
    // returns the lowest order found among a list of chains (typically as output by generate chains)
    return chains.reduce( ( max, p ) => p.order > max ? p.order : max, chains[0].order );
  }

  generateChains( orderArray ) {
    /*
     *
     */
    let chains = [];
    for ( let itrOrder of orderArray ) {
      chains.push( new DataChain( this.markovData, itrOrder ));
    }
    return chains;
  }

  generateOutput( chains, quota, minLength = this.highestOrder( chains ), maxLength = this.markovObject.longestItem() ) {
    /*
     *
     */
    if ( minLength > maxLength) {
      throw new Error("minLength cannot be greater than maxLength");
    } else if ( minLength < 0 || maxLength < 0 ) {
      throw new Error("arguments cannot be negative numbers");
    } else if ( quota <= 0 ) {
      throw new Error("quota cannot be less than or equal to 0");
    }
    let output = [];

    for ( let itrGen = 0; itrGen < quota; itrGen++ ) { // perform "quota" number of generations
      let newGeneratedWord = '',
        orderMax = this.highestOrder( chains ),
        orderMin = this.lowestOrder( chains ),  
        initialRandomOrder = Math.floor( Math.random() * ( orderMax - orderMin ) + orderMin ),
        initialRandomNgrams = chains.find(( itr ) => {
        return itr.order === initialRandomOrder;
      }).initialNgrams;
      newGeneratedWord += initialRandomNgrams[ Math.floor( Math.random() * initialRandomNgrams.length )];
      do {
        // we want to make the maximum for the next random order selection the lesser between the length of the current string and the specified maximum
        let currentMaxOrder = newGeneratedWord.length < orderMax ? newGeneratedWord.length : orderMax;
        let endNgramChains;
        do {
          let currentRandomOrder = Math.floor( Math.random() * (( currentMaxOrder + 1 ) - orderMin )) + orderMin;
          let currentOrderChains = chains.find(( itr ) => {
            return itr.order === currentRandomOrder;
          }).chains;
          endNgramChains = currentOrderChains.find(( itr ) => {
            return itr.ngram === newGeneratedWord.substring( newGeneratedWord.length - currentRandomOrder, newGeneratedWord.length);
          });
        } while ( !endNgramChains );
        let endNgramNextChars = endNgramChains.nextChars;
        newGeneratedWord += endNgramNextChars[ Math.floor( Math.random() * endNgramNextChars.length)];
      } while ( newGeneratedWord[ newGeneratedWord.length - 1 ] !== WORD_END );
      if ( newGeneratedWord.length - 1 < minLength || newGeneratedWord.length - 1 > maxLength ) {
        console.log(`Rejected ${newGeneratedWord.substring( 0, newGeneratedWord.length - 1 )}: Beyond given range`)
        itrGen--;
      } else {
        output.push( newGeneratedWord.substring( 0, newGeneratedWord.length - 1 )); // add to genList without the END_WORD character
      }
    }
    return output;
  }
}

class MarkovObject {
  /* Base class that MarkovRawObject and MarkovJSONObject inherit from
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovObjectContainer and MarkovObjectChain classes
   */
  constructor() {
    this.type = "Markov_Object";
    this.list = [];
    this.tags = "";
  }

  extractTags( tagString ) {
    // Take a string of tags and create an array from them
    if ( !tagString ) {
      return []
    } else {
      return tagString.split(" ");
    }
  }

  shortestItem() {
    let temp = this.list.sort(( a, b ) => {
      return a.name.length - b.name.length;
    });
    return temp[0].length;
  }

  longestItem() {
    let temp = this.list.sort(( a, b ) => {
      return b.name.length - a.name.length;
    });
    return temp[0].name.length;
  }

  allCaps() {
    for ( let itrString in this.list ) {
      this.list[itrString] = this.list[itrString].toUpperCase();
    }
  }
}

class RawObject extends MarkovObject {
  /* Accepts a an object or array of objects of a specified format/schema(?)
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovObjectContainer and MarkovObjectChain classes
   */
  constructor( input ) {
    super();
    if ( typeof input === 'object' ) { // single-object input
      if ( !input["list"]) { // eventually, this will get replaced with proper JSON format validation
        throw new Error("Improperly formatted .json file!"); // maybe say something about the specified schema instead?
      } else {
        this.tags = input.tags;
        this.list = input.list;
      }
    } else if ( Array.isArray( input )) { // multi-object input
      let tempInputs = []; // stores the objects parsed from each input file
      let tempTagLists = []; // stores an array which contains an array of each tag, one for each input file
      input.forEach( ( element ) => {
        if ( typeof element === 'object') {
          tempInputs.push( element );
          tempTagLists.push( this.extractTags( element.tags ));
        } else {
          throw new Error("Invalid input for conversion into MarkovObject!");
        }
      });
      let globalTags = tempTagLists.reduce(( returnArray, currentArray ) => returnArray.filter( element => currentArray.includes( element ))); // go through the tags extracted earlier and create an array that is the intersection of them all, all the tags they have in common
      if ( globalTags.length ) {
        this.tags = globalTags.reduce(( returnString, element ) => ( returnString + " " + element ).trim() ); // store this list of commonly found tags in the new object after converting it back into a string

      }
      tempInputs.forEach( ( listObject ) => {
        let tempRemainingTags = this.extractTags( listObject.tags ).filter( element => !globalTags.includes( element )); // find all the strings not on the common/global list and store those
        listObject.list.forEach( ( listItem ) => {
          listItem.tags = listItem.tags + " " + tempRemainingTags.reduce(( returnString, element ) => ( returnString + " " + element ).trim() ); // add the stored remaining strings to each element
          this.list.push( listItem );
        });
      });
      this.list.sort(( a, b ) => { // tidy up by sorting alphabetically
        return ( a.name ).localeCompare( b.name );
      });
    } else {
      throw new Error("Invalid input for conversion into MarkovObject!");
    }
  }
}

class JSONObject extends MarkovObject {
  /* Accepts a .json file or files of a specified format/schema(?)
   * Has functions that are used to generate ngrams for analysis
   * Intended for use with the MarkovObjectContainer and MarkovObjectChain classes
   */
  constructor( input ) {
    super();
    if ( typeof input === 'string' && path.isAbsolute( input ) && path.extname( input ) === '.json') { // single-file input
      let temp = JSON.parse( fs.readFileSync( input,'utf8', err => {
        if (err) throw err;
      }));
      if ( !temp["list"]) { // eventually, this will get replaced with proper JSON format validation
        throw new Error("Improperly formatted .json file!"); // maybe say something about the specified schema instead?
      } else {
        this.tags = temp.tags;
        this.list = temp.list;
      }
    } else if ( Array.isArray( input )) { // multi-file input
      let tempInputs = []; // stores the objects parsed from each input file
      let tempTagLists = []; // stores an array which contains an array of each tag, one for each input file
      input.forEach( ( element ) => {
        if ( typeof element === 'string' && path.isAbsolute( element ) && path.extname( element ) === '.json') {
          let temp = JSON.parse( fs.readFileSync( element,'utf8', err => {
            if (err) throw err;
          }));
          tempInputs.push( temp );
          tempTagLists.push( this.extractTags( temp.tags ));
        } else {
          throw new Error("Invalid input for conversion into MarkovObject!");
        }
      });
      let globalTags = tempTagLists.reduce(( returnArray, currentArray ) => returnArray.filter( element => currentArray.includes( element ))); // go through the tags extracted earlier and create an array that is the intersection of them all, all the tags they have in common
      if ( globalTags.length ) {
        this.tags = globalTags.reduce(( returnString, element ) => ( returnString + " " + element ).trim() ); // store this list of commonly found tags in the new object after converting it back into a string

      }
      tempInputs.forEach( ( listObject ) => {
        let tempRemainingTags = this.extractTags( listObject.tags ).filter( element => !globalTags.includes( element )); // find all the strings not on the common/global list and store those
        listObject.list.forEach( ( listItem ) => {
          listItem.tags = listItem.tags + " " + tempRemainingTags.reduce(( returnString, element ) => ( returnString + " " + element ).trim() ); // add the stored remaining strings to each element
          this.list.push( listItem );
        });
      });
      this.list.sort(( a, b ) => { // tidy up by sorting alphabetically
        return ( a.name ).localeCompare( b.name );
      });
    } else {
      throw new Error("Invalid input for conversion into MarkovObject!");
    }
  }
}

class ObjectChain {
  /* Accepts a MarkovObjects object and creates a markov chain from the data contained within
   * of the specified order (number of elements per ngram).
   */
  constructor( markovObject, order, filterTags = "") { // need to handle when the filter tags don't exist and no chain can be made
    this.order = order;
    this.chains = [];
    this.initialNgrams = [];

    // filter markovObject list down
    let tempObjectList = [];
    if ( filterTags === "" ) { // if no filterTags were specified, just add the entire list from the MarkovObject given (this could technically be ||'d with the below if, but a separate condition makes it more clear)
      tempObjectList = markovObject.list;
    } else if ( markovObject.tags.split(" ").filter( item => filterTags.split(" ").includes( item )).length ) { // check if the MarkovObject contains any of the specified tag, if so, add the entire list
      tempObjectList = markovObject.list;
    } else {
      markovObject.list.forEach( ( listItem ) => { // check each individual listItem in the MarkovObject for tags from the list and push them one by one
        if ( listItem.tags.split(" ").filter( item => filterTags.split(" ").includes( item )).length ) {
          tempObjectList.push( listItem );
        }
      });
    }
    if ( !tempObjectList.length ) {
      throw new Error(`Tags given yields an empty selection. Tags: ${filterTags}`);
    }
    for ( let itrWord of tempObjectList ) {
      if ( itrWord.name.length <= order ) { // skip this word if it's too short
        console.log(`Skipped ${itrWord.name}: word is beyond given order range of ${this.order}`);
        continue;
      }
      itrWord.name += WORD_END; // appends char used to mark the end of chain
      this.initialNgrams.push( itrWord.name.substring( 0, this.order )); // we want to store every initialNgram, even repeats
      for ( let itrChar = 0; itrChar <= itrWord.name.length - (this.order + 1); itrChar++ ) {
        let ngram = itrWord.name.substring( itrChar, itrChar + this.order );
        let finder = this.chains.findIndex( itr => {
          return itr.ngram === ngram;
        });
        if ( finder !== -1 ) {
          this.chains[ finder ].nextChars.push( itrWord.name[ itrChar + this.order ]);
        } else {
          this.chains.push({'ngram':ngram, 'nextChars': [ itrWord.name[ itrChar + this.order ]]})
        }
      }
      itrWord.name = itrWord.name.substring( 0, itrWord.name.length - 1);
    }
    if ( !this.chains.length ) {
      throw new Error(`This MarkovData yields no chain given an order of ${this.order}`);
    } else {
      this.chains.sort(( a, b ) => { // sort each chain alphabetically based on the initial ngram
        return ( a.ngram ).localeCompare( b.ngram );
      });
    }
  }
}

class ObjectContainer {
  /*
   *
   */
  constructor( markovObject ) {
    if ( markovObject.type !== "Markov_Object" ) {
      throw new Error("Invalid MarkovData input!")
    }
    this.markovObject = markovObject;
  }

  generateChains( orderArray, filterTags ) {
    // Generates one or several chains using the currently stored data
    let chains = [];
    for ( let itrOrder of orderArray ) {
      chains.push( new ObjectChain( this.markovObject, itrOrder, filterTags ));
    }
    return chains;
  }

  // got some weird behavior where the end of word character was output when the minLength was specified as lower than the highest given chain order
  // should probably enforce this on the generateOutput functions of both Containers
  generateOutput( chains, quota, minLength = this.highestOrder( chains ), maxLength = this.markovObject.longestItem() ) {
    /*
     *
     */
    if ( minLength > maxLength) {
      throw new Error("minLength cannot be greater than maxLength");
    } else if ( minLength < 0 || maxLength < 0 ) {
      throw new Error("arguments cannot be negative numbers");
    } else if ( quota <= 0 ) {
      throw new Error("quota cannot be less than or equal to 0");
    }
    let output = [];

    for ( let itrGen = 0; itrGen < quota; itrGen++ ) { // perform "quota" number of generations
      let newGeneratedWord = '',
        orderMax = this.highestOrder( chains ),
        orderMin = this.lowestOrder( chains ),  
        initialRandomOrder = Math.floor( Math.random() * ( orderMax - orderMin ) + orderMin ),
        initialRandomNgrams = chains.find(( itr ) => {
        return itr.order === initialRandomOrder;
      }).initialNgrams;
      newGeneratedWord += initialRandomNgrams[ Math.floor( Math.random() * initialRandomNgrams.length )];
      do {
        // we want to make the maximum for the next random order selection the lesser between the length of the current string and the specified maximum
        let currentMaxOrder = newGeneratedWord.length < orderMax ? newGeneratedWord.length : orderMax;
        let endNgramChains;
        do {
          let currentRandomOrder = Math.floor( Math.random() * (( currentMaxOrder + 1 ) - orderMin )) + orderMin;
          let currentOrderChains = chains.find(( itr ) => {
            return itr.order === currentRandomOrder;
          }).chains;
          endNgramChains = currentOrderChains.find(( itr ) => {
            return itr.ngram === newGeneratedWord.substring( newGeneratedWord.length - currentRandomOrder, newGeneratedWord.length);
          });
        } while ( !endNgramChains );
        let endNgramNextChars = endNgramChains.nextChars;
        newGeneratedWord += endNgramNextChars[ Math.floor( Math.random() * endNgramNextChars.length)];
      } while ( newGeneratedWord[ newGeneratedWord.length - 1 ] !== WORD_END );
      if ( newGeneratedWord.length - 1 < minLength || newGeneratedWord.length - 1 > maxLength ) {
        console.log(`Rejected ${newGeneratedWord.substring( 0, newGeneratedWord.length - 1 )}: Beyond given range`)
        itrGen--;
      } else {
        output.push( newGeneratedWord.substring( 0, newGeneratedWord.length - 1 )); // add to genList without the END_WORD character
      }
    }
    return output;
  }

  lowestOrder( chains ) { // truthfully, I'm not exactly sure how these two functions work... or even if they work...
    // returns the lowest order found among a list of chains (typically as output by generate chains)
    return chains.reduce( ( min, p ) => p.order < min ? p.order : min, chains[0].order ); // wtf is 'p' here? need a more useful name on these
  }

  highestOrder( chains ) {
    // returns the lowest order found among a list of chains (typically as output by generate chains)
    return chains.reduce( ( max, p ) => p.order > max ? p.order : max, chains[0].order );
  }
}

module.exports = { ArrayData, JSONArrayData, TextListData, DataChain, DataContainer, RawObject, JSONObject, ObjectChain, ObjectContainer };