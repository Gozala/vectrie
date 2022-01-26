export interface PersistentVector<T> {
  readonly size: number
  readonly shift: number // BITS times (the depth of this trie minus one)
  readonly root: VectorNode<T>
  readonly tail: T[]
}

export interface MutableVector<T> {
  size: number
  shift: number
  root: VectorNode<T>
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

  values(options?: RangedIteratorOptions): IterableIterator<T>
}

export interface VectorNode<T> {
  edit: null | Edit

  children: VectorNode<T>[]
  leaves: T[]
}

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
