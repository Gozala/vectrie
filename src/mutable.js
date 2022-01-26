import * as API from "./api.js"
import * as Node from "./node.js"
import { BITS, WIDTH, MASK, tailOffset } from "./core.js"

/**
 * @template T
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 * @param {T} value
 */
export const conj = (self, value) => {
  if (self.root.edit) {
    if (self.size - tailOffset(self.size) < WIDTH) {
      self.tail[self.size & MASK] = value
      self.size += 1
      return self
    } else {
      const tailNode = Node.createLeaf(self.root.edit, self.tail)
      const tail = new Array(WIDTH)
      tail[0] = value
      self.tail = tail

      if (self.size >>> BITS > 1 << self.shift) {
        const newRoot = Node.createBranch(self.root.edit)
        newRoot.children[0] = self.root
        newRoot.children[1] = Node.newPath(self.root.edit, self.shift, tailNode)

        self.root = newRoot // Node.create(self.root.edit, newRootArray)
        self.shift += BITS
        self.size += 1
        return self
      } else {
        const newRoot = pushTail(
          self,
          self.root.edit,
          self.shift,
          self.root,
          tailNode
        )
        self.root = newRoot
        self.size += 1
        return self
      }
    }
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
    switch (self.size) {
      case 0:
        throw new RangeError(`Can't pop empty vector`)
      case 1:
        delete self.tail[0]
        self.size = 0
        return self
      default: {
        if (((self.size - 1) & MASK) > 0) {
          delete self.tail[(self.size - 1) & MASK]
          self.size -= 1
          return self
        } else {
          const tail = unsafeArrayFor(self, self.root.edit, self.size - 2)
          const root =
            popTail(self, self.root.edit, self.shift, self.root) ||
            Node.createBranch(self.root.edit)
          if (self.shift > BITS && root.children[1] == null) {
            self.root = root
            self.shift -= BITS
            self.size -= 1
            self.tail = tail
            return self
          } else {
            self.root = root
            self.size -= 1
            self.tail = tail
            return self
          }
        }
      }
    }
  } else {
    throw new RangeError("mutable.pop called after seal()")
  }
}

/**
 * @template T, M
 * @param {API.PersistentVector<T>} self
 * @param {API.Edit} edit
 * @param {number} level
 * @param {API.VectorNode<T>} source
 */
const popTail = (self, edit, level, source) => {
  const node = Node.asMutableBranch(edit, source)
  const subidx = ((self.size - 2) >>> level) & MASK
  if (level > 5) {
    const newChild = popTail(self, edit, level - BITS, node.children[subidx])
    if (newChild == null && subidx === 0) {
      return null
    } else {
      newChild == null
        ? delete node.children[subidx]
        : (node.children[subidx] = newChild)
      return node
    }
  } else if (subidx === 0) {
    return null
  } else {
    delete node.children[subidx]
    return node
  }
}

/**
 * @template T
 * @template {API.MutableVector<T>} Self
 * @param {Self} self
 * @param {number} n
 * @param {T} value
 */
export const set = (self, n, value) => {
  if (self.root.edit) {
    if (n >= 0 && n < self.size) {
      if (tailOffset(self.size) <= n) {
        self.tail[n & MASK] = value
        return self
      } else {
        const newRoot = assoc(
          self,
          self.root.edit,
          self.shift,
          self.root,
          n,
          value
        )
        self.root = newRoot
        return self
      }
    } else if (n === self.size) {
      return conj(self, value)
    } else {
      throw new RangeError(`Index ${n} is out of bounds [0, ${self.size}]`)
    }
  } else {
    throw new RangeError("set called after seal")
  }
}

/**
 * @template T, M
 * @param {API.MutableVector<T>} self
 * @param {API.Edit} edit
 * @param {number} level
 * @param {API.VectorNode<T>} node
 * @param {number} n
 * @param {T} value
 */

const assoc = (self, edit, level, node, n, value) => {
  if (level === 0) {
    const newNode = Node.asMutableLeaf(edit, node)
    newNode.leaves[n & MASK] = value
    return newNode
  } else {
    const newNode = Node.asMutableBranch(edit, node)
    const subidx = (n >>> level) & MASK
    newNode.children[subidx] = assoc(
      self,
      edit,
      level - BITS,
      newNode.children[subidx],
      n,
      value
    )

    return newNode
  }
}

/**
 * @template T, M
 * @param {API.MutableVector<T>} self
 * @param {API.Edit} edit
 * @param {number} level
 * @param {API.VectorNode<T>} parent
 * @param {API.VectorNode<T>} tailNode
 */
const pushTail = (self, edit, level, parent, tailNode) => {
  const newNode = Node.asMutableBranch(edit, parent)
  const subidx = ((self.size - 1) >>> level) & MASK
  if (level === BITS) {
    newNode.children[subidx] = tailNode
  } else {
    const child = newNode.children[subidx]
    const newChild =
      child != null
        ? pushTail(self, edit, level - BITS, child, tailNode)
        : Node.newPath(self.root.edit, level - BITS, tailNode)
    newNode.children[subidx] = newChild
  }

  return newNode
}

/**
 * @template T, M
 * @param {API.MutableVector<T>} self
 * @param {API.Edit} edit
 * @param {number} n
 *
 * @returns {T[]}
 */
const unsafeArrayFor = (self, edit, n) => {
  if (n >= tailOffset(self.size)) {
    return self.tail
  } else {
    let node = self.root
    let level = self.shift
    // perform branching on internal nodes
    while (level > 0) {
      node = node.children[(n >>> level) & MASK]
      level -= BITS
    }

    return node.edit === edit ? node.leaves : node.leaves.slice()
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
    root: editableRoot(root),
    tail: editableTail(tail),
  })

/**
 * @template T
 * @param {API.VectorNode<T>} root
 */
const editableRoot = root => Node.asMutableBranch({}, root)

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
