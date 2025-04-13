import levenshtein from '@zendesk/ckeditor/models/levenshtein';

/**
 * The Trie class represents a prefix tree data structure, which provides efficient operations for word insertion,
 * deletion, and prefix-based searching. Each node in the trie corresponds to a character of the words being stored,
 * and the tree structure represents the prefix relationships between words.  Iterations per character will never
 * surpass the number of unique characters in the trie.
 *
 * Visual representation of trie structure for the word "CAR", "CAT", "POT", "PART", "PASS", "PAST".
 *
 *      ┏━━━━┻━━━━┓
 *      P         CA
 *      ┃         ┃
 *      ┃         ┣━━ R     CAR
 *    ┏━┻━┓       ┗━━ T     CAT
 *    A   OT                POT
 *    ┃
 *    ┣━━ RT                PART
 *    ┃
 *    ┗━━ S ━━━━━━━━━ S     PASS
 *        ┗━━━━━━━━━━ T     PAST
 */

class Trie {

  model = null;
  flush = null;
  index = null;

  constructor({ input }) {

    // Initialize the trie model
    this.model = {};
    this.index = 0;

    // Insert the input into the trie and compress it
    this.tokenize(input);
    this.compress();

  }

  // Loop through the input and insert each word into the trie
  tokenize (input) {

    switch (input.constructor) {
      case String:
        this.insert(input);
      break;

      case Array:
        input.forEach(i => this.insert(i));
      break;

      default:
        throw new Error('Invalid constructor, must be String or Array');
    }

  }

  // Register the word in the trie and mark the completion of the word at the last node
  insert (word, node = this.model) {

    // Loop through each character in the word and create a new node if it doesn't exist
    for (const character of word.toLowerCase()) {
      node = node[character] ??= {};
    }

    node.flush = true;               // Mark the end of a word using flush symbol
    node.index = ++this.index; // Assign the insertion index to the word

  }

  // Compresses the trie by merging single-child nodes into their parents
  compress (node = this.model) {

    for (const [key, childNode] of Object.entries(node)) {

      // Skip non-object nodes and the flush symbol
      if (typeof childNode !== 'object' || childNode.flush) {
        continue;
      }

      // Get the keys of the child node
      const keys = Object.keys(childNode);

      // If the child node has only one child, merge it with the parent node
      if (keys.length === 1) {
        node[ key + keys[0] ] = childNode[ keys[0] ];
        delete node[key];
      }

      // Recurse into the child node, whether it was merged or not.
      this.compress(childNode);

    }

  }

  // Finds all words in the trie that start with the given prefix
  findWords (word, maxWord = 1, node = this.model, list = []) {

    if (list.length >= maxWord) {
      return list;
    }

    if (node.flush) {
      list.push(word);
    }

    Object.keys(node).forEach(character => {
      this.findWords(word + character, maxWord, node[character], list);
    });

    return list;

  }

  // Method to check if a word exists in the trie
  contains (word, node = this.model) {

    let remainingWord = word.toLowerCase();

    while (remainingWord.length > 0 && node) {
      let found = false;

      for (const key in node) {
        if (key === this.flush) continue;

        const keyLength = key.length;

        if (remainingWord.substring(0, keyLength) === key) {
            remainingWord = remainingWord.substring(keyLength);
            node = node[key];
            found = true;
            break;
        }

      }

      if (!found) return false;
    }

    return remainingWord.length === 0 && !!node.flush;

  }

  // Modified levenshteinSearch to use the new levenshtein method with early exit
  levenshteinSearch (target, maxDistance = 1, node = this.model, word = '', results = []) {

    if (node.flush) {
      const distance = levenshtein(word, target, maxDistance);
      if (distance <= maxDistance) {
        results.push({ word, distance, index: node.index });
      }
    }

    for (const key in node) {
      if (key !== this.flush) {
        this.levenshteinSearch(target, maxDistance, node[key], word + key, results);
      }
    }

    return results;

  }

  closest (target, maxDistance) {

    if ( this.contains(target) ) {
      return [];
    }

    const result = this.levenshteinSearch(target, maxDistance);

    const highIndexThreshold = 5000; // Adjust this threshold based on your data
    const indexPenaltyFactor = .01; // This factor determines how much penalty to apply

    const data = result.sort((a, b) => {
      // Apply penalty to distance based on index so more common words are preferred
      const adjustedDistanceA = a.distance + (a.index > highIndexThreshold ? (a.index - highIndexThreshold) * indexPenaltyFactor : 0);
      const adjustedDistanceB = b.distance + (b.index > highIndexThreshold ? (b.index - highIndexThreshold) * indexPenaltyFactor : 0);

      // First compare the adjusted distances
      if (adjustedDistanceA !== adjustedDistanceB) {
          return adjustedDistanceA - adjustedDistanceB;
      }

      // If adjusted distances are equal, then sort by index
      return a.index - b.index;
    });

    return data;

  }

  // Returns an array of words that start with the given prefix
  complete (prefix, maxWord = 1, node = this.model) {

    if (typeof prefix !== 'string') {
      throw new Error('Input must be a string');
    }

    // Return an empty array if the prefix is an empty string
    if (prefix === '') {
      return (maxWord > 1) ? [] : undefined;
    }

    const prefixLower = prefix.toLowerCase();
    let idx = 0;
    let matchedPrefix = '';

    while (idx < prefixLower.length) {
      const segment = prefixLower.substring(idx);
      const keys = Object.keys(node);
      const matchingKey = keys.find(key => key.startsWith(segment) || segment.startsWith(key));

      if (!matchingKey) {
        return (maxWord > 1) ? [] : undefined;  // Prefix not found in trie
      }

      matchedPrefix += matchingKey;
      node = node[matchingKey];
      idx += matchingKey.length;
    }

    const match = this.findWords(matchedPrefix, maxWord, node, []);
    return (maxWord > 1) ? match : match[0];

  }

}

// Exports
export default Trie;
