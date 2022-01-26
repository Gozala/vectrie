import * as API from "./api.js"
import * as Node from "./node.js"
import { ReadonlyIndexedView } from "./sugar.js"
import { tailOffset, leavesFor, BITS, WIDTH, MASK } from "./core.js"
import * as mutable from "./mutable.js"
import { range } from "./util.js"

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
 * @template [U=undefined]
 
 * @param {API.PersistentVector<T>} self
 * @param {number} n 
 * @param {U} [notFound=undefined]
 * @returns {T|U}
 */
export const nth = (self, n, notFound = undefined) =>
  n >= 0 && n < self.size
    ? leavesFor(self, n)[n & MASK]
    : /** @type {U} */ (notFound)

export const get = nth

/**
 * @template T, M
 * @template [U=undefined]
 
 * @param {API.PersistentVector<T>} self
 * @param {U} [notFound=undefined]
 * @returns {T|U}
 */
export const peek = (self, notFound = undefined) =>
  nth(self, self.size - 1, notFound)

/**
 * @template T, M
 
 * @param {API.PersistentVector<T>} self
 * @returns {API.PersistentVectorView<T>}
 */
export const pop = self => {
  switch (self.size) {
    case 0:
      throw new RangeError(`Can't pop empty vector`)
    case 1:
      return clear(self)
    default: {
      if (self.size - tailOffset(self.size) > 1) {
        return new PersistentVectorView({
          ...self,
          size: self.size - 1,
          tail: self.tail.slice(0, self.tail.length - 1),
        })
      } else {
        const tail = leavesFor(self, self.size - 2)
        const root = popTail(self, self.shift, self.root) || Node.emptyBranch()
        const size = self.size - 1
        if (self.shift > BITS && root.children[1] == null) {
          return new PersistentVectorView({
            ...self,
            size,
            shift: self.shift - BITS,
            root: root.children[0],
            tail,
          })
        } else {
          return new PersistentVectorView({
            ...self,
            size,
            root,
            tail,
          })
        }
      }
    }
  }
}

/**
 * @template T, M
 * @param {API.PersistentVector<T>} self
 * @param {number} level
 * @param {API.VectorNode<T>} node
 */
const popTail = (self, level, node) => {
  const subidx = ((self.size - 2) >>> level) & MASK
  if (level > 5) {
    const newChild = popTail(self, level - BITS, node.children[subidx])
    if (newChild == null && subidx === 0) {
      return null
    } else {
      const newNode = Node.cloneBranch(node)
      newChild == null
        ? delete newNode.children[subidx]
        : (newNode.children[subidx] = newChild)
      return newNode
    }
  } else if (subidx === 0) {
    return null
  } else {
    const newNode = Node.cloneBranch(node)
    delete newNode.children[subidx]
    return newNode
  }
}

/**
 * @template M, T
 * @param {API.PersistentVector<T>} self
 * @param {T} value
 * @returns {API.PersistentVectorView<T>}
 */
export const conj = ({ size, shift, root, tail, ...old }, value) => {
  // There is room for a new value in the rightmost leaf node
  if (size - tailOffset(size) < WIDTH) {
    return new PersistentVectorView({
      ...old,
      root,
      shift,
      size: size + 1,
      tail: [...tail, value],
    })
  } else {
    const rootOverflow = size >>> BITS > 1 << shift
    const newShift = rootOverflow ? shift + BITS : shift
    const newRoot = rootOverflow
      ? reRoot({ root, shift, tail })
      : pushTail({ size: size }, shift, root, Node.createLeaf(null, tail))

    return new PersistentVectorView({
      ...old,
      size: size + 1,
      shift: newShift,
      root: newRoot,
      tail: [value],
    })
  }
}

export const push = conj

/**
 * @template M, T
 * @param {API.PersistentVector<T>} self
 * @param {number} index
 * @param {T} value
 */
export const set = (self, index, value) => {
  if (index >= 0 && index < self.size) {
    if (tailOffset(self.size) <= index) {
      const tail = self.tail.slice()
      tail[index & MASK] = value
      return new PersistentVectorView({ ...self, tail })
    } else {
      return new PersistentVectorView({
        ...self,
        root: assoc(self, self.shift, self.root, index, value),
      })
    }
  } else if (index === self.size) {
    return conj(self, value)
  } else {
    throw new RangeError(`Index ${index} is out of bounds [0, ${self.size}]`)
  }
}

/**
 * @template T, M
 * @param {API.PersistentVector<T>} self
 * @param {number} level
 * @param {API.VectorNode<T>} node
 * @param {number} index
 * @param {T} value
 */
const assoc = (self, level, node, index, value) => {
  if (level === 0) {
    const newNode = Node.createLeaf(node)
    newNode.leaves[index & MASK] = value
    return newNode
  } else {
    const newNode = Node.cloneBranch(node)
    const subidx = (index >>> level) & MASK
    newNode.children[subidx] = assoc(
      self,
      level - BITS,
      node.children[subidx],
      index,
      value
    )
    return newNode
  }
}

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

/**
 * Creates a new `root` node level up from the given one.
 *
 * @template T
 * @param {object} input
 * @param {API.VectorNode<T>} input.root
 * @param {T[]} input.tail
 * @param {number} input.shift
 */
const reRoot = ({ root, tail, shift }) => {
  const newRoot = Node.createBranch(null)
  newRoot.children[0] = root
  newRoot.children[1] = Node.newPath(null, shift, Node.createLeaf(null, tail))
  return newRoot
}

/**
 * @template T
 * @param {{size:number}} self
 * @param {number} level
 * @param {API.VectorNode<T>} parent
 * @param {API.VectorNode<T>} tailNode
 */

const pushTail = (self, level, parent, tailNode) => {
  let root = Node.cloneBranch(parent)
  let subidx = ((self.size - 1) >>> level) & MASK
  if (level === BITS) {
    root.children[subidx] = tailNode
    return root
  } else {
    const child = parent.children[subidx]
    if (child != null) {
      const nodeToInsert = pushTail(self, level - BITS, child, tailNode)
      root.children[subidx] = nodeToInsert
      return root
    } else {
      const nodeToInsert = Node.newPath(null, level - BITS, tailNode)
      root.children[subidx] = nodeToInsert
      return root
    }
  }
}

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {{start?:number, end?:number}} [options]
 * @returns {IterableIterator<T>}
 */
export const iterator = (self, { start = 0, end = count(self) } = {}) =>
  new RangedIteratorView({
    offset: start,
    base: start - (start % WIDTH),
    leaf: start < count(self) ? leavesFor(self, start) : [],
    start,
    end,
    source: self,
  })

/**
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {{start?:number, end?:number}} [options]
 * @returns {IterableIterator<[number, T]>}
 */
export const entries = function* (self, { start = 0, end = count(self) } = {}) {
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
