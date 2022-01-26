import * as API from "./api.js"
import { WIDTH, BITS } from "./core.js"

/**
 * @template T
 * @returns {API.VectorNode<T>}
 */
export const emptyBranch = () => EMPTY_BRANCH_NODE

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.VectorNode<T>[]} children
 * @returns {API.VectorNode<T>}
 */
export const createBranch = (edit, children = new Array(WIDTH)) =>
  new BranchNodeView({ edit, children })

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {T[]} leaves
 * @returns {API.VectorNode<T>}
 */
export const createLeaf = (edit, leaves = new Array(WIDTH)) =>
  new LeafNodeView({ edit, leaves })

/**
 * @template T
 * @param {API.Edit} edit
 * @param {API.VectorNode<T>} node
 * @returns {API.VectorNode<T>}
 */
export const asMutableBranch = (edit, node) =>
  node.edit === edit ? node : createBranch(edit, node.children.slice())

/**
 * @template T
 * @param {API.Edit} edit
 * @param {API.VectorNode<T>} node
 * @returns {API.VectorNode<T>}
 */
export const asMutableLeaf = (edit, node) =>
  node.edit === edit ? node : createLeaf(edit, node.leaves.slice())

/**
 * @template T
 * @param {API.VectorNode<T>} node
 * @returns {API.VectorNode<T>}
 */
export const cloneBranch = ({ edit, children }) =>
  createBranch(edit, children.slice())

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
    root = createBranch(edit)
    root.children[0] = embed

    level -= BITS
  }

  return root
}
// /**
//  * @template T
//  * @implements {API.VectorNode<T>}
//  */
// class VectorNodeView {
//   /**
//    *
//    * @param {API.VectorNode<T>} node
//    */
//   constructor({ edit, arr }) {
//     this.edit = edit
//     this.arr = arr
//   }
// }

/**
 * @template T
 * @implements {API.VectorNode<T>}
 */
class BranchNodeView {
  /**
   * @param {object} input
   * @param {API.Edit|null} input.edit
   * @param {API.VectorNode<T>[]} input.children
   */
  constructor({ edit, children }) {
    this.edit = edit
    this.children = children
  }
  /**
   * @type {never}
   */
  get leaves() {
    throw new Error("Branch nodes contain no leaves")
  }
}

/**
 * @template T
 * @implements {API.VectorNode<T>}
 */
class LeafNodeView {
  /**
   * @param {object} input
   * @param {API.Edit|null} input.edit
   * @param {T[]} input.leaves
   */
  constructor({ edit, leaves }) {
    this.edit = edit
    this.leaves = leaves
  }
  /**
   * @type {never}
   */
  get children() {
    throw new Error("Leaf nodes contain no children")
  }
}

const EMPTY_BRANCH_NODE = createBranch({
  edit: null,
  arr: new Array(WIDTH),
})
