import * as API from "./api.js"
export * from "./api.js"
export const BITS = 5

export const WIDTH = /** @type {32} */ (1 << BITS) // 2^5 = 32
export const MASK = /** @type {32} */ (WIDTH - 1) // 31 or 0x1f

/**
 * @template T, M, U
 * @param {API.PersistentVector<T>} self
 * @param {number} n
 * @param {U} outOfBounds
 */
export const arrayFor = (self, n, outOfBounds) =>
  n >= 0 && n < self.size ? unsafeArrayFor(self, n) : outOfBounds

/**
 * @template T, M
 * @param {API.PersistentVector<T>} self
 * @param {number} n
 * @returns {T[]}
 */
export const unsafeArrayFor = (self, n) => {
  if (n >= tailOffset(self.size)) {
    return self.tail
  } else {
    let node = self.root
    let level = self.shift
    // perform branching on internal nodes
    while (level > 0) {
      node = getChild(node, (n >>> level) & MASK)
      level -= BITS
    }

    // Last element is the leaf node
    return /** @type {T[]} */ (node.arr)
  }
}

/**
 * @param {number} size
 */
export const tailOffset = size =>
  size < WIDTH ? 0 : ((size - 1) >>> BITS) << BITS

/**
 * @template T
 * @param {API.VectorNode<T>} node
 * @param {number} index
 * @returns {API.VectorNode<T>}
 */
export const getChild = (node, index) =>
  /** @type {API.VectorNode<T>} */ (node.arr[index])

/**
 * @template T
 * @param {API.VectorNode<T>} node
 * @param {number} index
 * @param {API.VectorNode<T>} child
 */
export const setChild = (node, index, child) => {
  node.arr[index] = child
}
