# MarkovModule
## Overview
* MarkovMachine class, the primary class, is an object that processes data, and outputs procedural content
* A number of external functions will process a variety of data input in a variety of ways:
  * simple functions for creating ngram lists and ngram distributions for analysis
  * several different objects that will take data from different sources and create chains from said sources
* chains passed into the MarkovMachine will be cached so that repeated calls for generation from the same dataset can be generated quickly and cleanly without repeating work
* both character and word level chain support

## TODO
* Add support for word level chains
* Rethink how chains are built, currently complexity is O(n^"to the power of how many chains we are generating")
  * and there's probably a way to generate the chains as we iterate through the list once and only once, rather than looping through it several times
* validate the JSON data SCHEMA VALIDATION
* Look over sorting algorithms and make sure data is being handled properly (sorting is actually happening)
* Properly comment code, check over equivalent functions and make sure they work one to one
* Find format for comments and documenting classes
* Investigate tests and TDD
* Learn more git functionality, starting with branching and comments

## (21/09/2019)
* Use proper git technique when building this next version!
* It's clear now that a lot of the data-handling and tagging manipulation that I was trying to handle with the markov module is not actually this modules job, but should be the work of some middleware or an actual database management system. It will be important to remember this for similar projects in the future
* The only types of input that the Markov Machine should need to handle are raw text input, text file input, array input, and .json file array input
  * all of these should be turned into simple javascript arrays, which can be stored in the program and passed directly into the machine
* change word_end character to the dollar sign to mirror regex standard of symbols for ease of understanding, the word_start was never used, so discard it
* don't make so many different class-method bundles, feel free to use free-standing functions to process data
* get rid of the chain middle man and the ambiguity between data and object, ONE single machine and ONE single type of chain. All of the processing functions funnel the data into one type from several, but get rid of the parallel paths and the redundant code that results. Any metadata should be processed before it gets to the chain and machine stage and should be stripped away by then
* cache chains for reuse when the same input source is used
* be more efficient in chain processing, as words are iterated through, adjust the ranges of ngrams that are being worked on and then shorten the ranges until none are left as necessary, to accomodates different 'n's, rather than looping through the same dataset multiple times unnecessarily
  * e.g. given a word "Brunhilde" and an order of 2-5, start at the beginning of the string and grab all ngrams with 'n's of 2, 3, 4, & 5, so "BR", "BRU", "BRUN", & "BRUNH", adding to the appropriate chain as it goes. Continue to iterate as previous, but as the loop nears the end of the string and the larger orders become out of range, remove them from the process for that particular string. Then, repeat for the next word

## (11/08/2019)
* I wonder if there's a way to decouple the structures more, and whether or not that would be better (it probably would be, as the container wouldn't have to be recreated for each iteration)
  * Theoretically, I would take the container and chain structures and make them generic and keep a variety of "classes" (could they become functions or perhaps should they?) for processing the data differently each time initially depending on the data source and format

## (03/08/2019)
* perhaps the chain should be generated upon the need for generation as specified by the user, rather than having several floating around, and later I can set these to be cached for rapid-fire storage using similar chains
* Is it worthwhile when generating chains to also create a list of all the tags among the individual items and then store an array of each item that corresponds to that tag? I think it would make tag filtering more expensive, but it could also make each document significantly larger
* tags should all be lowercase and any spaces in a tag should be converted to underscores in scraping
* going back and forth between the different variations of chain and container and the two types of Object's constructors is bad and will lead to hard-to-find errors. Need to find the points in both where there is commonality and create a function in a parent object or an external helper function or something that centralizes the code

## (31/07/2019)
* It's clear that more MarkovData classes should be created. Mainly to separate out the different constructors to avoid the clutter involved in adding decision structures to a single instance of the class. But also because I want to handle more complex .json files with data such as gender and special versions of the MarkovModule classes seem necessary in order to properly implement all of that.
  * So then part of the issue is whether or not the MarkovChain and MarkovContainer objects should also get their own special versions of the objects. I think the answer to that question is yes, but only an attempt at implementing them will tell for sure.
  * Create MarkovObjects, MarkovObjectsChain, MarkovObjectsContainer and, for now, give them functionality to add multiple base files and also filter results based on gender
  * simultaneosly, create the variations on the MarkovData object by creating an object with that name that will serve as the base class and then create ones to handle arrays, text files, .json files with just arrays, etc.
### Overview (old)
* Three main data types: MarkovData, MarkovContainer & MarkovChain
  * MarkovData is a wrapper for some collection of data that will be used in a MarkovContainer to generate MarkovChains. It contains functions for outputting ngram lists of various orders in json format, will auto-detect the level based on the input and can output the list itself in json format. Its primary purpose is preparing data for the MarkovContainer class.
  * MarkovContainer generates and stores MarkovChain objects. It uses MarkovData objects to generate these and can take multiple MarkovData objects of the same level to create a series of MarkovChain objects. By default, MarkovChain objects will be generated with an order minimum of 2 and maximum of the smallest item of the level above the chosen level (e.g. the shortest word in a list of words or the shortest sentence in a paragraph).
  * MarkovChain is a simple object generated by and stored within a MarkovContainer which stores a list of ngrams and the characters that follow them in a probability distribution. Every MarkovChain has an order and also stores beginning sequence signifiers based on their order. They also store end of sequence signifiers.