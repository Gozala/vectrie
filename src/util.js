/**
 * Returns iterable of numbers in the range of `from .. to`
 * inclusive of `from` and exclusive of of `to`.
 *
 * @param {number} from
 * @param {number} to
 */
export const range = function* (from, to) {
  let n = from
  while (n < to) {
    yield n
    n += 1
  }
}
