import * as API from "./api.js"
import * as Node from "./trie.js"
import { ReadonlyIndexedView } from "./sugar.js"
import {
  tailOffset,
  BITS,
  conj as doconj,
  pop as dopop,
  set as doset,
} from "./core.js"
import * as mutable from "./mutable.js"
import { nth, peek } from "./lookup.js"
import { values, entries, keys } from "./iteration.js"
import { equals } from "./equality.js"

/**
 * @template T
 * @returns {API.PersistentVectorView<T>}
 */
export const empty = () => EMPTY

/**
 * @template T
 * @param {API.PersistentVector<T>} _self
 * @returns {API.PersistentVectorView<T>}
 */
export const clear = _self => EMPTY

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @returns {API.PersistentVectorView<T>}
 */
export const clone = self => new PersistentVectorView(self)

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 */
export const count = self => self.size

/**
 * @template T
 
 * @param {API.PersistentVector<T>} self
 * @returns {API.PersistentVectorView<T>}
 */
export const pop = self => new PersistentVectorView(dopop(null, self))

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {T} value
 * @returns {API.PersistentVectorView<T>}
 */
export const conj = (self, value) =>
  new PersistentVectorView(doconj(null, self, value))
export const push = conj

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {number} offset
 * @param {T} value
 */
export const set = (self, offset, value) =>
  new PersistentVectorView(doset(null, self, offset, value))

/**
 * @template T
 * @param {Iterable<T>} input
 * @returns {API.PersistentVectorView<T>}
 */
export const from = input => {
  const array = Array.isArray(input) ? input : [...input]
  const { length } = array
  if (length < 32) {
    return new PersistentVectorView({
      size: length,
      shift: BITS,
      root: Node.emptyBranch(),
      tail: array.slice(),
    })
  } else {
    let vec = new PersistentVectorView({
      size: 32,
      shift: BITS,
      root: Node.emptyBranch(),
      tail: array.slice(0, 32),
    })
    let node = mutable.from(vec)

    let i = 32

    while (i < length) {
      node = mutable.conj(node, array[i])
      i += 1
    }

    return seal(node)
  }
}

/**
 * @template T
 * @param {T[]} items
 */
export const of = (...items) => from(items)

/**
 * @template T, M
 * @param {API.MutableVector<T>} self
 * @returns {API.PersistentVectorView<T>}
 */
export const seal = self => {
  if (self.root.edit) {
    self.root.edit = null
    const length = self.size - tailOffset(self.size)
    const tail = new Array(length)
    let n = 0
    while (n < length) {
      tail[n] = self.tail[n]
      n++
    }

    return new PersistentVectorView({
      ...self,
      tail,
    })
  } else {
    throw new RangeError("Seal called twice")
  }
}

/**
 * @template T
 * @implements {Iterable<T>}
 * @implements {API.PersistentVectorView<T>}
 * @extends {ReadonlyIndexedView<T>}
 */
class PersistentVectorView extends ReadonlyIndexedView {
  /**
   * @param {API.PersistentVector<T>} vector
   */
  constructor({ size, shift, root, tail }) {
    super()
    /** @readonly */
    this.size = size
    /** @readonly */
    this.shift = shift
    /** @readonly */
    this.root = root
    /** @readonly */
    this.tail = tail
  }

  /**
   * @returns {API.PersistentVectorView<T>}
   */
  clone() {
    return clone(this)
  }

  /**
   * @param {T} value
   * @returns {API.PersistentVectorView<T>}
   */
  push(value) {
    return conj(this, value)
  }

  /**
   * @template [U=undefined]
   * @param {number} index
   * @param {U} [fallback]
   */
  get(index, fallback) {
    return nth(this, index, fallback)
  }

  /**
   * @param {number} index
   * @param {T} value
   * @returns {API.PersistentVectorView<T>}
   */
  set(index, value) {
    return set(this, index, value)
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

  /**
   * @returns {API.PersistentVectorView<T>}
   */
  clear() {
    return EMPTY
  }

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

  /**
   * @param {API.PersistentVector<T>} other
   * @returns {other is API.PersistentVectorView<T>}
   */
  equals(other) {
    return equals(this, other)
  }
}

/** @type {API.PersistentVectorView<any>} */
const EMPTY = new PersistentVectorView({
  size: 0,
  shift: 5,
  root: Node.emptyBranch(),
  tail: [],
})
