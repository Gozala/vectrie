import * as API from "./api.js"
import { range } from "./util.js"
import { leavesFor, WIDTH, MASK } from "./core.js"

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {{start?:number, end?:number}} [options]
 * @returns {IterableIterator<T>}
 */
export const iterator = (self, { start = 0, end = self.size } = {}) =>
  new RangedIteratorView({
    offset: start,
    base: start - (start % WIDTH),
    leaf: start < self.size ? leavesFor(self, start) : [],
    start,
    end,
    source: self,
  })

/**
 * @template T
 * @implements {API.RangedIteratorView<T>}
 */
class RangedIteratorView {
  /**
   * @param {API.RangedIterator<T>} input
   */
  constructor({ offset, base, leaf, start, end, source }) {
    this.offset = offset
    this.base = base
    this.leaf = leaf
    this.start = start
    this.end = end
    this.source = source
  }
  [Symbol.iterator]() {
    return this
  }
  /**
   * @returns {{done:true, value:void}|{done:false, value:T}}
   */
  next() {
    if (this.offset >= this.end) {
      return { done: true, value: undefined }
    } else {
      if (this.offset - this.base === WIDTH) {
        this.leaf = leavesFor(this.source, this.offset)
        this.base += WIDTH
      }

      const value = this.leaf[this.offset & MASK]
      this.offset++

      return { done: false, value }
    }
  }
}

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {{start?:number, end?:number}} [options]
 * @returns {IterableIterator<[number, T]>}
 */
export const entries = function* (self, { start = 0, end = self.size } = {}) {
  let n = start
  for (const value of values(self, { start, end })) {
    yield [n, value]
    n++
  }
}

export const values = iterator

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @returns {IterableIterator<number>}
 */
export const keys = self => range(0, self.size)
