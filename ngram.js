/**
 * The Ngram class is responsible for building an n-gram model of a given text.
 * An n-gram is a contiguous sequence of n items from a given text or speech.
 * This class provides functionalities to count n-grams, calculate the probabilities,
 * and create a model which can be used for various language processing tasks.
 *
 * The n-gram model is a statistical language model used to predict the next word in a sequence
 * based on the previous n-1 words. This implementation supports n-gram model creation and probability
 * calculation for given text data.
 *
 * Visual representation of trigram (n=3) model probability structure for the text:
 * "The cat sat here. The cat sat on the mat. The cat sat on the hat. The dog sat there. The dog ran here".
 *
 *                      [1.00]: THE
 *         ┏━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━┓
 *       [0.60]: CAT                   [0.40]:DOG
 *         ┃                                ┃
 *       [1.00]: SAT               ┏━━━━━━━━┻━━━━━━━━┓
 *         ┃                     [0.50]: SAT       [0.50]: RAN
 *         ┃                       ┃                 ┃
 *    ┏━━━━┻━━━━━━━━━━┓          [1.00]: THERE     [1.00]: HERE
 *  [0.33]: HERE   [0.67]: ON
 *                    ┃
 *                 [1.00]: THE
 *            ┏━━━━━━━┻━━━━━━━┓
 *          [0.50]: MAT    [0.50]: HAT
*/

class Ngram {

    size   = null; // The n-gram size
    model  = null; // The n-gram model
    lookup = '';   // The last suggested word
  
    // TODO: Add support for international end-of-sentence punctuation
    static punctuation = /[.!?␃]$/;
  
    constructor ({ input, size = 4 }) {
  
      // Store the n-gram size
      this.size  = size;
  
      // Load the n-gram model
      this.setValue(input);
  
    }
  
    // Create an n-gram instance with a given text and size value
    setValue (text) {
  
      const tokens = this.tokenize(text);              // Tokenize the input text
      const grams  = this.tabulate(tokens, this.size); // Count occurrences of n-grams
  
      // calculate n-gram probability
      this.model = this.probabilities(grams);
  
    }
  
    // Tokenize a given text into words.
    tokenize (text) {
  
      if (typeof text !== 'string') {
        throw new Error('Invalid constructor, must be String');
      }
  
      // Split string into an array while ignoring white spaces
      return text.split(/\s+/);
  
    }
  
    // Counts the occurrences of n-grams in the tokenized text
    tabulate (tokens, size) {
  
      if (typeof size !== 'number' || size <= 0) {
        throw new Error('Invalid n value, must be a positive number');
      }
  
      // Initialize a new Map to store the count of each n-gram
      const ngrams = new Map();
  
      // Iterate through the tokens array, considering each possible n-gram
      for (let i = 0; i <= tokens.length - size; i++) {
  
         // Skip to the next iteration if a break character is found in n-gram sequence but not at the end
        if ( tokens.slice(i, i + size - 1).some(this.isEndOfSentence) ) {
          continue; // Skip to the next iteration if a break character is found
        }
  
        const ngram = tokens.slice(i, i + size).join(' ');
        ngrams.set(ngram.replace('␃', ''), (ngrams.get(ngram) ?? 0) + 1);
  
      }
  
      // Return map of n-gram counts
      return ngrams;
  
    }
  
    // Calculates the probabilities of each n-gram in the n-gram map
    probabilities (grams) {
  
      const map = new Map();
      const totalNgrams = Array.from(grams.values()).reduce((sum, count) => sum + count, 0);
  
      // Compute probability of each n-gram
      for (const [ngram, count] of grams) {
        map.set(ngram, count / totalNgrams);
      }
  
      // Return map of n-gram probabilities
      return map;
  
    }
  
    // Helper function to check for end-of-sentence punctuation
    isEndOfSentence (word) {
      return Ngram.punctuation.test(word);
    }
  
    complete (prefix, maxWords = 1) {
  
      const words = this.tokenize(prefix); // Tokenize the prefix
      const index = this.size - 1;         // Get the index of the last word
  
  
      // Clear lookup if the prefix is empty
      if (prefix === '') {
        this.lookup = '';
        return '';
      }
  
      // Initialize a set to store seen sequences
      const seenSequences = new Set();
  
      for (let wordCount = 0; wordCount < maxWords; wordCount++) {
  
        // Get the most recent words
        const sequence = words.slice(-index).join(' ');
  
        // Break if the sequence was seen before, indicating a loop
        if (seenSequences.has(sequence)) {
          break;
        }
  
        // Add the current sequence to the seen sequences
        seenSequences.add(sequence);
  
        // Suggest the next word
        const nextWord = this.suggestNextWord(sequence, { sanitize: true });
  
        // Break if the next word is an end-of-sentence punctuation
        if (this.isEndOfSentence(nextWord)) {
          words.push(nextWord);
          break;
        }
  
        // Break if there is no next word
        if (!nextWord) {
          break;
        }
  
        // Add the next word to the sequence
        words.push(nextWord);
  
      }
  
      // Join the words into a sentence
      const suggestion = words.join(' ');
  
      if (suggestion !== prefix && suggestion !== this.lookup && suggestion.startsWith(prefix)) {
  
        // Update the last suggestion if a new word has been fully typed and matched
        this.lookup = suggestion;
  
      }
  
  
      if (this.lookup && this.lookup.startsWith(prefix)) {
        return this.lookup;
      } else {
        return suggestion;
      }
  
    }
  
    // Suggest the next word based on a given sequence of words
    suggestNextWord (sequence, { sanitize = false } = {}) {
  
      let maxProbability = 0;
      let suggestedWord  = '';
  
      for (const [ngram, probability] of this.model) {
  
        // Skip ngrams with probability lower than current max
        if (probability <= maxProbability) {
          continue;
        };
  
        const words = ngram.split(' ');
        const match = words.slice(0, -1).join(' '); // Get the n-gram prefix
  
        if ( sequence.toLowerCase().endsWith(match.toLowerCase()) ) {
          maxProbability = probability;             // Update max probability
          suggestedWord  = words[words.length - 1]; // Update suggested word
  
          // Exit early if perfect match is found
          if (maxProbability === 1) {
            break;
          }
        }
  
      }
  
      if (sanitize) {
          return suggestedWord.trim().replace(Ngram.punctuation, '')
      } else {
        return suggestedWord;
      }
  
    }
  
  }
  
  // Exports
  export default Ngram;
  