import * as API from "./api.js"
export const BITS = 5

export const WIDTH = /** @type {32} */ (1 << BITS) // 2^5 = 32
export const MASK = /** @type {32} */ (WIDTH - 1) // 31 or 0x1f

/**
 * @template T
 * @returns {API.Branch<T>}
 */
export const emptyBranch = () => EMPTY_BRANCH_NODE

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.VectorNode<T>[]} children
 * @returns {API.Branch<T>}
 */
export const createBranch = (edit, children = new Array(WIDTH)) => {
  children.length = WIDTH
  return new BranchNodeView({ edit, children })
}

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {T[]} leaves
 * @returns {API.Leaf<T>}
 */
export const createLeaf = (edit, leaves = new Array(WIDTH)) => {
  leaves.length = WIDTH
  return new LeafNodeView({ edit, leaves })
}

/**
 * @template T
 * @param {API.Branch<T>} node
 * @param {API.Edit|null} edit
 * @returns {API.Branch<T>}
 */
export const cloneBranch = (node, edit = node.edit) =>
  createBranch(edit, node.children.slice())

/**
 * @template T
 * @param {API.Leaf<T>} node
 * @param {API.Edit|null} edit
 * @returns {API.Leaf<T>}
 */
export const cloneLeaf = (node, edit = node.edit) =>
  createLeaf(edit, node.leaves.slice())

/**
 * Creates path to a given `embed` node of the `shift / BITS` deep.
 *
 * @template T
 * @param {API.Edit|null} edit
 * @param {number} shift
 * @param {API.VectorNode<T>} embed
 */

export const newPath = (edit, shift, embed) => {
  let level = shift
  let node = embed

  while (level !== 0) {
    const embed = node
    node = createBranch(edit, [embed])

    level -= BITS
  }

  return node
}

/**
 * @template T
 * @implements {API.Branch<T>}
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
  /* c8 ignore next 3 */
  get leaves() {
    throw new Error("Branch nodes contain no leaves")
  }
}

/**
 * @template T
 * @implements {API.Leaf<T>}
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
  /* c8 ignore next 3 */
  get children() {
    throw new Error("Leaf nodes contain no children")
  }
}

const EMPTY_BRANCH_NODE = createBranch(null)

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.Branch<T>} node
 */

export const forkBranch = (node, edit) =>
  edit === null
    ? cloneBranch(node)
    : edit === node.edit
    ? node
    : createBranch(edit, node.children.slice())

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {API.Leaf<T>} node
 */
export const forkLeaf = (node, edit) =>
  edit === null
    ? cloneLeaf(node)
    : edit === node.edit
    ? node
    : createLeaf(edit, node.leaves.slice())

/**
 * @template T
 * @param {API.Edit|null} edit
 * @param {T[]} tail
 */
export const forkTail = (tail, edit) => (edit === null ? tail.slice() : tail)
