// Score strings based on Levenshtein distance
const revisionScore = 1;
const additionScore = 1;
const deletionScore = 2;

/**
 * In this example revision are cheaper than additions or deletions:
 * { Revision: 1, Addition: 2, Deletion: 3 }
 *
 *                                'COURT'
 *    O > A   [ Revision: 1 ]   > 'CAURT'
 *    U > T   [ Revision: 1 ]   > 'CATRT'
 *    R -     [ Deletion: 2 ]   > 'CATT'
 *    T > S   [ revision: 3 ]   > 'CATS'
 *            [ Distance: 6 ]
 *
 * In this example revision are more expensive. However, deletions are still costly:
 * { Revision: 5, Addition: 2 Deletion: 3 }
 *
 *                                'COURT'
 *    O > A   [ Revision:  5 ]  > 'CAURT'
 *    U -     [ Deletion:  3 ]  > 'CART'
 *    R -     [ Deletion:  3 ]  > 'CAT'
 *    S +     [ Addition:  2 ]  > 'CATS'
 *            [ Distance: 13 ]
 */

const levenshtein = (source, target, maximumDistance) => {

  // Early return based on string length difference
  if (Math.abs(source.length - target.length) > maximumDistance) {
    return maximumDistance + 1;
  }

  // Initialize distance rows
  let prevRow = new Int32Array(target.length + 1);
  let currRow = new Int32Array(target.length + 1);

  // Initialize the first row of the distance matrix with the indexes of each character
  for (let j = 0; j <= target.length; j++) {
    prevRow[j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= source.length; i++) {

    // The cost of removing all characters up to the current one in the source string
    currRow[0] = i * additionScore;

    for (let j = 1; j <= target.length; j++) {

      // Substitution or no cost if characters are the same
      const revisionScoreConditional = source.charAt(i - 1) !== target.charAt(j - 1) ? revisionScore : 0;

      currRow[j] = Math.min(
        prevRow[j - 1] + revisionScoreConditional,
        currRow[j - 1] + deletionScore,
        prevRow[j - 0] + additionScore
      );

    }

    // Swap rows
    [prevRow, currRow] = [currRow, prevRow];

  }

  return prevRow[target.length];

}

export default levenshtein;
