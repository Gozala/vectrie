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

export interface MutableVectorView<T>
  extends MutableVector<T>,
    IndexedView<T>,
    LookupView<T>,
    AssociativeView<T, MutableVectorView<T>>,
    StackView<T, MutableVectorView<T>>,
    IterableView<T> {}

export interface AssociativeView<T, Self> {
  set(n: number, value: T): Self
}

export interface StackView<T, Self> {
  push(value: T): Self
  pop(): Self

  peek<U = undefined>(notFound?: U): T | U
}

export interface LookupView<T> {
  get(n: number): T | undefined
}
export interface IndexedView<T> extends LookupView<T> {
  readonly [n: number]: T
}

export interface IterableView<T> extends Iterable<T> {
  values(options?: Partial<RangedIteratorOptions>): IterableIterator<T>
  entries(
    options?: Partial<RangedIteratorOptions>
  ): IterableIterator<[number, T]>
  keys(): IterableIterator<number>
}

export interface CloneableView<Self> {
  clone(): Self
}

export interface EmptyableView<Self> {
  clear(): Self
}

export interface EqualityView<Other, Self extends Other> {
  equals(other: Other): other is Self
}

export interface PersistentVectorView<T>
  extends PersistentVector<T>,
    IndexedView<T>,
    LookupView<T>,
    AssociativeView<T, PersistentVectorView<T>>,
    StackView<T, PersistentVectorView<T>>,
    IterableView<T>,
    CloneableView<PersistentVectorView<T>>,
    EmptyableView<PersistentVectorView<T>>,
    EqualityView<PersistentVector<T>, PersistentVectorView<T>> {}

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
