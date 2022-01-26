import * as API from "./api.js"
import { WIDTH, BITS, getChild, setChild } from "./core.js"

/**
 * @template T
 * @returns {API.VectorNode<T>}
 */
export const empty = () => EMPTY_NODE

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {T[]} arr
 * @returns {API.VectorNode<T>}
 */
export const create = (edit, arr = new Array(WIDTH)) =>
  new VectorNodeView({ edit, arr })

/**
 * @template T
 * @param {API.Edit} edit
 * @param {API.VectorNode<T>} node
 * @returns {API.VectorNode<T>}
 */
export const asMutable = (edit, node) =>
  node.edit === edit ? node : clone({ ...node, edit })

/**
 * @template T
 * @param {API.VectorNode<T>} node
 * @returns {API.VectorNode<T>}
 */
export const clone = ({ edit, arr }) =>
  new VectorNodeView({ edit, arr: arr.slice() })

/**
 * @template T
 * @param {API.VectorNode<T>} node
 * @param {number} index
 * @param {T} leaf
 */
export const setLeaf = (node, index, leaf) => {
  node.arr[index] = leaf
}

export { getChild, setChild }

/**
 * @template T
 * @param {API.VectorNode<T>} node
 * @param {number} index
 */
export const deleteChild = (node, index) => {
  delete node.arr[index]
}

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {number} shift
 * @param {API.VectorNode<T>} node
 */

export const newPath = (edit, shift, node) => {
  let level = shift
  let root = node

  while (level !== 0) {
    const embed = root
    root = create(edit)
    setChild(root, 0, embed)

    level -= BITS
  }

  return root
}
/**
 * @template T
 * @implements {API.VectorNode<T>}
 */
class VectorNodeView {
  /**
   *
   * @param {API.VectorNode<T>} node
   */
  constructor({ edit, arr }) {
    this.edit = edit
    this.arr = arr
  }
}

const EMPTY_NODE = new VectorNodeView({
  edit: null,
  arr: new Array(WIDTH),
})
