import * as API from "./api.js"
export * from "./api.js"
export const BITS = 5

export const WIDTH = /** @type {32} */ (1 << BITS) // 2^5 = 32
export const MASK = /** @type {32} */ (WIDTH - 1) // 31 or 0x1f

/**
 * Returns leaves array in which element with given index `n` resides.
 *
 * @see https://hypirion.com/musings/understanding-persistent-vector-pt-2
 *
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {number} n
 * @returns {T[]}
 */
export const leavesFor = (self, n) => {
  // If n falls in a tail of the vector we simply return the referce of the
  // tail.
  if (n >= tailOffset(self.size)) {
    return self.tail
  }
  // Otherwise we traverse the trie branches
  else {
    // Node containing several levels branch nodes as children and the leaf
    // nodes at the bottom.
    let node = self.root
    // BITS times (the depth of this trie minus one).
    let level = self.shift
    // Perform branching on internal nodes. Please note that all the nodes up
    // until ground level will be "branch"es (that have children) and only at
    // the ground level we will have "leaf" nodes. However this invariant can
    // no be captured in the types which is why our nodes have `children` it's
    // just for leaves they're empty and all our nodes have `leaves` that are
    // empty on branches. That way type checker is happy but also of limited use.
    while (level > 0) {
      node = node.children[(n >>> level) & MASK]
      level -= BITS
    }

    // Note we know ground level contains leaf nodes so we return the leaves
    // back.
    return node.leaves
  }
}

/**
 * PersistentVector keeps the rightmost leaf in the tree a.k.a tail as an
 * important performance optimization. This function derives tail offset (that
 * is index of the first element that would fall into tail) from the vector
 * size.
 *
 * It is useful in lookup / update operations as to identify if element as it
 * tells if element at given index will be in the tree or a tail.
 *
 * @see https://hypirion.com/musings/understanding-persistent-vector-pt-3
 *
 * @param {number} size
 */
export const tailOffset = size =>
  size < WIDTH ? 0 : ((size - 1) >>> BITS) << BITS
