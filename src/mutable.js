import * as API from "./api.js"
import * as Node from "./trie.js"
import { WIDTH, conj as doconj, pop as dopop, set as doset } from "./core.js"

/**
 * @template T
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 * @param {T} value
 */
export const conj = (self, value) => {
  if (self.root.edit) {
    return new MutableVectorView(doconj(self.root.edit, self, value))
  } else {
    throw new RangeError("mutable.push called after seal()")
  }
}
export const push = conj

/**
 * @template T
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 */
export const pop = self => {
  if (self.root.edit) {
    return new MutableVectorView(dopop(self.root.edit, self))
  } else {
    throw new RangeError("mutable.pop called after seal()")
  }
}

/**
 * @template T
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 * @param {number} index
 * @param {T} value
 */
export const set = (self, index, value) => {
  if (self.root.edit) {
    return new MutableVectorView(doset(self.root.edit, self, index, value))
  } else {
    throw new RangeError("mutable.set called after seal()")
  }
}

/**
 * @template T
 * @param {API.PersistentVector<T>} vector
 * @returns {API.MutableVectorView<T>}
 */
export const from = ({ size: size, shift, root, tail }) =>
  new MutableVectorView({
    size,
    shift,
    root: Node.forkBranch(root, {}),
    tail: editableTail(tail),
  })

/**
 * @template T
 * @param {ReadonlyArray<T>} tail
 * @returns {T[]}
 */
const editableTail = tail => {
  const newTail = tail.slice()
  newTail.length = WIDTH
  return newTail
}

/**
 * @template T
 * @implements {API.MutableVectorView<T>}
 */
class MutableVectorView {
  /**
   * @param {API.MutableVector<T>} input
   */
  constructor({ size, shift, root, tail }) {
    this.size = size
    this.shift = shift
    this.root = root
    this.tail = tail
  }

  /**
   * @param {T} value
   */

  push(value) {
    return push(this, value)
  }

  /**
   * @param {number} n
   * @param {T} value
   */
  set(n, value) {
    return set(this, n, value)
  }
  pop() {
    return pop(this)
  }
}
