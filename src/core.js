import * as API from "./api.js"
export * from "./api.js"
import {
  BITS,
  WIDTH,
  MASK,
  createBranch,
  createLeaf,
  newPath,
  forkTail,
  forkBranch,
  forkLeaf,
} from "./trie.js"

export { BITS, WIDTH, MASK }

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.PersistentVector<T>} vector
 * @param {T} value
 * @returns {API.MutableVector<T>}
 */
export const conj = (edit, { size, tail, shift, root }, value) => {
  // There is room for a new value in the rightmost leaf node
  if (size - tailOffset(size) < WIDTH) {
    const newTail = forkTail(tail, edit)
    newTail[size & MASK] = value

    return { size: size + 1, tail: newTail, shift, root }
  } else {
    const newTail = new Array(WIDTH)
    newTail[0] = value

    const rootOverflow = size >>> BITS > 1 << shift
    const newShift = rootOverflow ? shift + BITS : shift
    const tailNode = createLeaf(edit, tail)
    const newRoot = rootOverflow
      ? createBranch(edit, [root, newPath(edit, shift, tailNode)])
      : pushTail(edit, root, shift, size - 1, tailNode)

    return {
      size: size + 1,
      shift: newShift,
      root: newRoot,
      tail: newTail,
    }
  }
}

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.Branch<T>} trie
 * @param {number} level
 * @param {number} index
 * @param {API.Leaf<T>} tailNode
 */
// export const pushTail = (edit, trie, level, index, tailNode) => {
//   let root = forkBranch(trie, edit)
//   let parent = root
//   let n = (index >>> level) & MASK

//   while (level > BITS) {
//     const child = parent.children[n]
//     if (child != null) {
//       const node = forkBranch(/** @type {API.Branch<T>} */ (child), edit)
//       parent.children[n] = node
//       parent = node
//       level -= BITS
//       n = (index >>> level) & MASK
//     } else {
//       const node = newPath(null, level - BITS, tailNode)
//       parent.children[n] = node
//       return root
//     }
//   }

//   parent.children[n] = tailNode
//   return root
// }
export const pushTail = (edit, trie, level, index, tailNode) => {
  const node = forkBranch(trie, edit)
  const n = (index >>> level) & MASK
  if (level > BITS) {
    const child = /** @type {API.Branch<T>|null} */ (node.children[n])
    node.children[n] =
      child != null
        ? pushTail(edit, child, level - BITS, index, tailNode)
        : newPath(edit, level - BITS, tailNode)
  } else {
    node.children[n] = tailNode
  }
  return node
}

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.PersistentVector<T>} vector
 * @param {number} n
 * @param {T} value
 */
export const set = (edit, vector, n, value) => {
  if (n >= 0 && n < vector.size) {
    // If falls into the tail we just copy tail, set value and create
    // a new vector sharing with tail copy.
    if (n >= tailOffset(vector.size)) {
      const tail = forkTail(vector.tail, edit)
      tail[n & MASK] = value

      return { ...vector, tail }
    }
    // Otherwise we need to set the value inside a root.
    else {
      return {
        ...vector,
        root: setInRoot(edit, vector.root, vector.shift, n, value),
      }
    }
  } else if (n === vector.size) {
    return conj(edit, vector, value)
  } else {
    throw new RangeError(`Index ${n} is out of bounds [0, ${vector.size}]`)
  }
}

/**
 * Creates a new vec
 *
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.Branch<T>} trie
 * @param {number} shift
 * @param {number} index
 * @param {T} value
 * @returns {API.Branch<T>}
 */
export const setInRoot = (edit, trie, shift, index, value) => {
  let level = shift

  // copy the root
  let root = forkBranch(trie, edit)
  let parent = root
  let n = (index >>> level) & MASK
  /** @type {API.VectorNode<T>} */
  let node = parent.children[n]
  while (level > BITS) {
    level -= BITS
    node = forkBranch(/** @type {API.Branch<T>} */ (node), edit)
    parent.children[n] = node

    n = (index >>> level) & MASK
    node = node.children[n]
  }

  const leaf = forkLeaf(/** @type {API.Leaf<T>} */ (node), edit)
  parent.children[n] = leaf
  leaf.leaves[index & MASK] = value

  return root
}

/**
 * @template T
 * @template {API.Edit|null} E
 * @param {E} edit
 * @param {API.PersistentVector<T>} vector
 * @returns {API.MutableVector<T>}
 */
export const pop = (edit, vector) => {
  switch (vector.size) {
    case 0:
      throw new RangeError(`Can't pop empty vector`)
    case 1:
      const tail = forkTail(vector.tail, edit)
      delete tail[0]

      return { ...vector, size: 0, tail }
    default: {
      const n = (vector.size - 1) & MASK
      if (n > 0) {
        const tail = forkTail(vector.tail, edit)
        delete tail[n]
        const size = vector.size - 1

        return { ...vector, size: size, tail }
      } else {
        // Find a array containing elements and make copy if it has
        // a different edit field because if it saved into mutable
        // vector tail it can be mutated.
        const tail = leavesFor(vector, vector.size - 2, edit)
        const root =
          popTail(edit, vector.root, vector.shift, vector.size - 2) ||
          createBranch(edit)

        if (vector.shift > BITS && root.children[1] == null) {
          const newRoot = /** @type {API.Branch<T>} */ (root.children[0])
          return {
            ...vector,
            size: vector.size - 1,
            tail,
            shift: vector.shift - BITS,
            // if this is mutable API we need to make sure that correct edit
            // field is set, however if it is immutable API (in which case
            // edit is null) we do not want to create unecessary root copy.
            root: edit ? forkBranch(newRoot, edit) : newRoot,
          }
        } else {
          return { ...vector, root, tail, size: vector.size - 1 }
        }
      }
    }
  }
}

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.Branch<T>} trie
 * @param {number} level
 * @param {number} index
 * @returns {API.Branch<T>|null}
 */
const popTail = (edit, trie, level, index) => {
  const offset = (index >>> level) & MASK

  if (level > BITS) {
    const child =
      /** @type {API.Branch<T>} - We know it's level isn't 0 so it'a a branch */
      (trie.children[offset])
    const newChild = popTail(edit, child, level - BITS, index)
    if (newChild == null && offset === 0) {
      return null
    } else {
      const node = forkBranch(trie, edit)
      newChild == null
        ? delete node.children[offset]
        : (node.children[offset] = newChild)
      return node
    }
  } else if (offset === 0) {
    return null
  } else {
    const node = forkBranch(trie, edit)
    delete node.children[offset]
    return node
  }
}

/**
 * Returns leaves array in which element with given index `n` resides.
 *
 * @see https://hypirion.com/musings/understanding-persistent-vector-pt-2
 *
 * @template T
 * @param {API.PersistentVector<T>} self
 * @param {number} n
 * @param {API.Edit|null} [edit=null]
 * @returns {T[]}
 */
export const leavesFor = (self, n, edit = null) => {
  // If n falls in a tail of the vector we simply return the referce of the
  // tail.
  if (n >= tailOffset(self.size)) {
    return self.tail
  }
  // Otherwise we traverse the trie branches
  else {
    // Node containing several levels branch nodes as children and the leaf
    // nodes at the bottom.
    /** @type {API.VectorNode<T>} */
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
    // If optional `edit` is passed and it is different from the owner we make
    // a copy so that caller can mutate it.
    return edit === null || node.edit === edit
      ? node.leaves
      : node.leaves.slice()
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
