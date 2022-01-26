import * as API from "./api.js"
import * as Node from "./node.js"
import { BITS, WIDTH, MASK, tailOffset } from "./core.js"

/**
 * @template T, M
 * @param {API.MutableVector<T>} self
 * @param {T} value
 */
export const conj = (self, value) => {
  if (self.root.edit) {
    if (self.size - tailOffset(self.size) < WIDTH) {
      self.tail[self.size & MASK] = value
      self.size += 1
      return self
    } else {
      const tailNode = Node.create(self.root.edit, self.tail)
      const tail = new Array(WIDTH)
      tail[0] = value
      self.tail = tail

      if (self.size >>> BITS > 1 << self.shift) {
        const newRoot = Node.create(self.root.edit)
        // const newRootArray = new Array(WIDTH)
        // newRootArray[0] = self.root
        // newRootArray[1] = Node.newPath(self.root.edit, self.shift, tailNode)
        Node.setLeaf(newRoot, 0, self.root)
        Node.setLeaf(
          newRoot,
          1,
          Node.newPath(self.root.edit, self.shift, tailNode)
        )

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
 * @template T, M
 * @param {API.MutableVector<T>} self
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
  const newNode = Node.asMutable(edit, node)
  if (level === 0) {
    Node.setLeaf(newNode, n & MASK, value)
  } else {
    const subidx = (n >>> level) & MASK
    Node.setChild(
      newNode,
      subidx,
      assoc(self, edit, level - BITS, Node.getChild(newNode, subidx), n, value)
    )
  }
  return newNode
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
  const newNode = Node.asMutable(edit, parent)
  const subidx = ((self.size - 1) >>> level) & MASK
  if (level === BITS) {
    Node.setChild(newNode, subidx, tailNode)
  } else {
    const child = Node.getChild(newNode, subidx)
    const newChild =
      child != null
        ? pushTail(self, edit, level - BITS, child, tailNode)
        : Node.newPath(self.root.edit, level - BITS, tailNode)
    Node.setChild(newNode, subidx, newChild)
  }

  return newNode
}

/**
 * @template T, M
 * @param {API.PersistentVector<T>} vector
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
const editableRoot = root => Node.asMutable({}, root)

/**
 * @template T
 * @param {ReadonlyArray<T>} tail
 * @returns {T[]}
 */
const editableTail = tail => tail.slice(0, WIDTH)

/**
 * @template T
 * @implements {API.MutableVector<T>}
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
}
