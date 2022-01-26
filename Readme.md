# vectrie

JS implementation of persistent bit-partitioned vector trie a.k.a vector data structure in Clojure.

Library provides `PersistentVector` immutable and fully persistent data type with `O(log32 N)` `get` and `set` operations, and `O(1)` `push` and `pop` operations.

In addition companion `MutableVector` mutabale dual is provided for performance critical code paths and batch operations that provides compatible API but with a smaller memory overhead.

## Usage

```ts
import * as Vec from "vectrie"

const pv1 = Vec.from([1, 2, 3, 4])
Vec.get(pv1, 0) // => 1
Vec.get(pv1, 4) // => undefined
Vec.get(pv1, 4, "not-found") // => not-found

const pv2 = Vec.push(pv1, 5)
Vec.get(pv2, 4) // => 5
```

In performance critical code & batch operations you can use [transient][] vector:

```ts
let tv = Vec.mutable.from(pv1)
for (const n of input) {
  tv = Vec.mutable.push(tv, n)
}
const pv3 = Vec.seal(tv)
```

If you want some sugar and more conventional JS API, there is `PersistentVectorView` to help you with that:

```js
const v1 = Vec.PersistentVectorView.from([1, 2, 3, 4])
v1.get(0) // => 1
v1[0] // => 1

const v2 = v1.set(0, 5)
v2[0] // => 5
```

## Comparison to alternatives

### [ImmutableJS](https://immutable-js.com/)

ImmutableJS is a good and a lot more mature library which comes with a lot more data structures out of the box. [List](https://immutable-js.com/docs/v4.0.0/List/) data structure is an equivalent of a `PersistentVector` and to my knowledge they are both ports of the Clojure's vector implementation. Here is how this library differs

1. vectrie (deliberately) provides _only_ `PersistentVector` data type.
2. vectrie is written in typescript _([JS with JSDoc types][ts-jsdoc] to be accurate)_ which affects API design:

   - `PersistentVector<T>` unlike `Immutable.List` is continues and not sparse. It would be fare to say that `PersistentVector<T>` is more like [Vector in rust][rust-vec] while `Immutable.List` is more like JS `Array`.
   - Setting out of bound value on `PersistentVector` a `RangeError` while in `Immutable.List` it creates sparse list.
   - `PersistentVector<T>` has no `splice`, `slice`, `unshift`, `reverse` because there is no effecient way to perfrom those operations on bit-partitioned vector tries while retaining desired performance profile _(which is why both clojure and immutable JS return different data structure when you do so)_.

     vectrie does not do that because in many cases modeling data with different types is a better alternative to abstracting it away.

3. `PersistentVector` implementation decouples data from operations that can be performed on it. This makes moving them across realms / threads, serailzing / deserializing hassle free.

   Library also provides sugar via `PersistentVectorView` to provide more conventional API in JS. It also makes it possible for you to write your own `View` providing alternative API without inheritence or other counterproductive features.

4. `PersistentVectorView` provides indexed access to underlying elements (e.g. `pv[0]` to get first element) which is of questionable benefit, but does seem more natural in JS. Note that updates do not work the same way.

### [Immer](https://immerjs.github.io/immer/)

Immer is popular library which provide immutablity from the comfort of the mutable interface. Vectrie library borrows from clojure [transient][]s and goes other way round, providing mutability (when needed) from the comfort of immutable interface.

[ts-jsdoc]: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
[rust-vec]: https://doc.rust-lang.org/rust-by-example/std/vec.html
[transient]: https://clojure.org/reference/transients
