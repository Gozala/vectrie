export interface PersistentVector<T> {
  readonly size: number
  readonly shift: number // BITS times (the depth of this trie minus one)
  readonly root: Branch<T>
  readonly tail: T[]
}

export interface MutableVector<T> {
  size: number
  shift: number
  root: Branch<T>
  tail: T[]
}

export interface MutableVectorView<T> extends MutableVector<T> {
  push(value: T): MutableVectorView<T>
  set(n: number, value: T): MutableVectorView<T>
  pop(): MutableVectorView<T>
}
export interface ReadonlyIndexedView<T> {
  readonly [n: number]: T

  get(n: number): T | undefined
}

export interface PersistentVectorView<T>
  extends PersistentVector<T>,
    ReadonlyIndexedView<T>,
    Iterable<T> {
  readonly size: number

  push(value: T): PersistentVectorView<T>
  get<U = undefined>(n: number, notFound?: U): T | U
  set(n: number, value: T): PersistentVectorView<T>

  peek<U = undefined>(notFound?: U): T | U

  pop(): PersistentVectorView<T>

  clear(): PersistentVectorView<T>

  clone(): PersistentVectorView<T>

  equals(other: PersistentVector<T>): other is PersistentVectorView<T>

  values(options?: Partial<RangedIteratorOptions>): IterableIterator<T>
  entries(
    options?: Partial<RangedIteratorOptions>
  ): IterableIterator<[number, T]>
  keys(): IterableIterator<number>
}

/**
 * `VectorNode` reprenests nodes of the bit-partitioned vector trie. Which may
 * represent either `branch` nodes containing children or `leaf` nodes
 * containing `leaves`. Using type union e.g. `Node<T> = Branch<T> | Leaf<T>`
 * would be more accurate however it would also require excessive checks even
 * though we have more effetive way to traverse trie. Which why instead we
 * encode nodes as `Branch<T> & Leaf<T>` so we do not have to convince type
 * checker which node we're dealing with.
 */
// export interface VectorNode<T> {
//   /**
//    * `MutableVector` tags nodes it creates with `edit`'s so it can tell which
//    * nodes it can safely update in-place and which it can't.
//    */
//   edit: null | Edit

//   children: VectorNode<T>[]
//   leaves: T[]
// }

export interface Branch<T> {
  edit: null | Edit
  leaves: never
  children: Trie<T>[]
}

export interface Leaf<T> {
  edit: null | Edit
  children: never

  leaves: T[]
}

export type Trie<T> = Branch<T> | Leaf<T>
export type VectorNode<T> = Trie<T>

export interface Edit {}

export interface RangedIteratorOptions {
  readonly start: number
  readonly end: number
}
export interface RangedIterator<T> extends RangedIteratorOptions {
  offset: number
  base: number
  leaf: ReadonlyArray<T>
  readonly source: PersistentVector<T>
}

export interface RangedIteratorView<T>
  extends RangedIterator<T>,
    IterableIterator<T> {}

export interface Editor<Edit> {
  forkVector<T>(self: PersistentVector<T>): MutableVector<T>
}
