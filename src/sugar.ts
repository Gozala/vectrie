export declare class ReadonlyIndexedView<T> {
  readonly [n: number]: T

  get(n: number): T | undefined
}
