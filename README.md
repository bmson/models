# Models

A collection of simple data models for text processing in JavaScript. Zero dependencies between modules — import only what you need.

## Modules

### Trie

A compressed prefix tree (radix tree) for fast word lookup, autocomplete, and fuzzy matching via Levenshtein distance.

```
       ┏━━━━┻━━━━┓
       P         CA
       ┃         ┃
       ┃         ┣━━ R     CAR
     ┏━┻━┓       ┗━━ T     CAT
     A   OT                POT
     ┃
     ┣━━ RT                PART
     ┗━━ S ━━ S            PASS
              T            PAST
```

Single-child nodes are automatically merged during construction (e.g. `C` + `A` → `CA`), reducing tree depth and lookup time.

```js
import Trie from './trie.js';

const trie = new Trie({ input: ['car', 'cat', 'cart', 'card', 'pot'] });

// Autocomplete — returns the first match by default
trie.complete('ca');        // 'car'
trie.complete('ca', 5);    // ['car', 'cat', 'cart', 'card']

// Exact lookup
trie.contains('cat');       // true
trie.contains('cab');       // false

// Fuzzy search — find words within a Levenshtein distance
trie.closest('crt', 2);    // [{ word: 'car', distance: 1, index: 1 }, ...]
```

**API**

| Method | Returns | Description |
|---|---|---|
| `new Trie({ input })` | `Trie` | Build from a `string` or `string[]`. |
| `complete(prefix, maxWord?)` | `string \| string[]` | Autocomplete. Returns a single string when `maxWord` is 1 (default), an array otherwise. |
| `contains(word)` | `boolean` | Exact membership test. |
| `closest(target, maxDistance?)` | `Array<{ word, distance, index }>` | Fuzzy matches sorted by edit distance, with a frequency-based index penalty for less common words. |
| `findWords(prefix, maxWord?)` | `string[]` | All words under a given node (internal, but public). |

---

### N-gram

A statistical language model that predicts the next word based on the preceding *n − 1* words. Useful for autocomplete and text suggestions.

```
                  [1.00]: THE
     ┏━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┓
   [0.60]: CAT                [0.40]: DOG
     ┃                              ┃
   [1.00]: SAT            ┏━━━━━━━━━┻━━━━━━━━┓
     ┃                   [0.50]: SAT       [0.50]: RAN
┏━━━━┻━━━━━━━┓             ┃                  ┃
HERE       ON            THERE              HERE
[0.33]    [0.67]         [1.00]             [1.00]
```

```js
import Ngram from './ngram.js';

const ngram = new Ngram({
  input: 'The cat sat on the mat. The cat sat on the hat. The dog ran here.',
  size: 3  // trigram (default: 4)
});

// Suggest the most probable next word
ngram.suggestNextWord('cat sat');  // 'on'

// Complete a phrase up to N words or end-of-sentence
ngram.complete('The cat', 5);      // 'The cat sat on the mat'
```

**API**

| Method | Returns | Description |
|---|---|---|
| `new Ngram({ input, size? })` | `Ngram` | Build from a text string. `size` defaults to `4` (4-gram). |
| `complete(prefix, maxWords?)` | `string` | Extends `prefix` with up to `maxWords` predicted words. Stops at sentence-ending punctuation or a prediction loop. |
| `suggestNextWord(sequence, opts?)` | `string` | Returns the single highest-probability next word. Pass `{ sanitize: true }` to strip trailing punctuation. |
| `setValue(text)` | `void` | Replace the model with a new text corpus. |

---

### Levenshtein

Weighted Levenshtein distance between two strings, with separate costs for revisions, additions, and deletions. Used internally by the Trie for fuzzy search.

```js
import levenshtein from './levenshtein.js';

levenshtein('court', 'cats', Infinity);  // weighted edit distance
```

The default weights are:

| Operation | Cost |
|---|---|
| Revision (substitution) | 1 |
| Addition (insertion) | 1 |
| Deletion | 2 |

A `maximumDistance` parameter enables early exit — if the length difference alone exceeds it, the function returns immediately without computing the full matrix.
