import * as API from "./api.js"
import { iterator } from "./iteration.js"

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {API.PersistentVector<T>} other
 * @returns {other is self}
 */
export const equals = (self, other) => {
  if (self.size === other.size) {
    const left = iterator(self)
    const right = iterator(other)
    while (true) {
      const { value, done } = left.next()
      if (done) {
        return true
      } else if (value !== right.next().value) {
        return false
      }
    }
  } else {
    return false
  }
}
