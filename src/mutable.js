import * as API from "./api.js"
import * as Node from "./trie.js"
import { WIDTH, conj as doconj, pop as dopop, set as doset } from "./core.js"
import { values, entries, keys } from "./iteration.js"
import { nth, peek } from "./lookup.js"
import { ReadonlyIndexedView } from "./sugar.js"

/**
 * @template T
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 * @param {T} value
 */
export const conj = (self, value) => {
  if (self.root.edit) {
    return patch(self, doconj(self.root.edit, self, value))
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
    return patch(self, dopop(self.root.edit, self))
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
    return patch(self, doset(self.root.edit, self, index, value))
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
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 * @param {API.PersistentVector<T>} delta
 */
const patch = (self, { size, shift, root, tail }) => {
  self.size = size
  self.shift = shift
  self.root = root
  self.tail = tail
  return self
}

/**
 * @template T
 * @implements {API.MutableVectorView<T>}
 * @extends {ReadonlyIndexedView<T>}
 */
class MutableVectorView extends ReadonlyIndexedView {
  /**
   * @param {API.MutableVector<T>} input
   */
  constructor({ size, shift, root, tail }) {
    super()
    this.size = size
    this.shift = shift
    this.root = root
    this.tail = tail
  }

  // Stack API

  /**
   * @param {T} value
   */

  push(value) {
    return push(this, value)
  }

  /**
   * @template [U=undefined]
   * @param {U} [fallback]
   */
  peek(fallback) {
    return peek(this, fallback)
  }
  pop() {
    return pop(this)
  }

  // ArrayLike API

  /**
   * @template [U=undefined]
   * @param {number} index
   * @param {U} [fallback]
   */
  get(index, fallback) {
    return nth(this, index, fallback)
  }

  /**
   * @param {number} n
   * @param {T} value
   */
  set(n, value) {
    return set(this, n, value)
  }

  // Iteraction API

  get [Symbol.iterator]() {
    return this.values
  }

  /**
   * @param {{start?:number, end?:number}} [options]
   */
  values(options) {
    return values(this, options)
  }

  /**
   * @param {{start?:number, end?:number}} [options]
   */
  entries(options) {
    return entries(this, options)
  }

  /**
   * @returns {IterableIterator<number>}
   */
  keys() {
    return keys(this)
  }
}
