import { describe, assert, it } from "./test.js"
import * as Vec from "../src/lib.js"
import { range } from "../src/util.js"

describe("basics", () => {
  it("nth", () => {
    assert.equal(Vec.nth(Vec.from(["a", "b", "c", "d"]), 0), "a")
    assert.equal(Vec.nth(Vec.from(["a", "b", "c", "d"]), 0.1), "a")
  })

  it("set in the root", () => {
    const v1 = Vec.from(range(0, 90))
    const v2 = Vec.set(v1, 0, -1)

    assert.equal(Vec.get(v1, 0), 0)
    assert.equal(Vec.get(v2, 0), -1)
    assert.equal(Vec.get(v1, 1), 1)
    assert.equal(Vec.get(v2, 1), 1)
  })

  it("basic ops", () => {
    const pv = Vec.from(range(0, 97))
    assert.equal(Vec.nth(pv, 96), 96)

    assert.equal(Vec.nth(pv, 97), undefined)
    assert.equal(Vec.nth(pv, 97, { nothing: true }), { nothing: true })
  })

  it("push", () => {
    assert.equal(Vec.push(Vec.empty(), 1), Vec.from([1]))
    assert.equal(Vec.empty().push(1).push(2), Vec.from([1, 2]))
    assert.equal(Vec.from([2, 3]).push(1), Vec.from([2, 3, 1]))
  })
  it("pop", () => {
    const pv = Vec.from(range(0, 33))
    const pv2 = pv.pop().pop().push(31).push(32)

    assert.ok(Vec.equals(pv, pv2))
    assert.equal([...pv], [...pv2])
  })

  it("stack", () => {
    const v0 = Vec.from(range(0, 97))
    const v1 = Vec.pop(v0)
    const v2 = Vec.pop(v1)

    assert.equal(Vec.peek(v1), 95)
    assert.equal(Vec.peek(v2), 94)
  })

  it("indexed access", () => {
    const pv = Vec.from(range(0, 97))

    for (const n of range(0, 97)) {
      assert.equal(pv[n], n, `pv[${n}] == ${pv[n]} != ${n}`)
    }
    assert.equal(pv[98], undefined)
  })

  // Ported from https://github.com/immutable-js/immutable-js/blob/main/__tests__/List.ts
  it("of provides initial values", () => {
    const v = Vec.of("a", "b", "c")
    assert.equal(v.get(0), "a")
    assert.equal(v.get(1), "b")
    assert.equal(v.get(2), "c")
  })

  it("can be spread into array", () => {
    const v = Vec.of("a", "b", "c")
    assert.equal([...v], ["a", "b", "c"])
  })

  it("does not accept a scalar", () => {
    assert.throws(() => {
      // @ts-expect-error - must be iterable
      Vec.from(3)
    })
  })
  it("accepts an array", () => {
    const v = Vec.from(["a", "b", "c"])
    assert.equal(v.get(1), "b")
    assert.equal([...v], ["a", "b", "c"])
  })

  it("accepts iterables, including strings", () => {
    const v = Vec.from("abc")
    assert.equal(v.get(1), "b")
    assert.equal([...v], ["a", "b", "c"])
  })

  it("can set and get a value", () => {
    const v = Vec.empty()
    assert.equal(v.get(0), undefined)
    const v2 = v.set(0, "value")
    assert.equal(v2.get(0), "value")
    assert.equal(v.get(0), undefined)
  })

  it("setting creates a new instance", () => {
    const v0 = Vec.of("a")
    const v1 = v0.set(0, "A")
    assert.equal(v0.get(0), "a")
    assert.equal(v1.get(0), "A")
  })

  it("size includes the highest index", () => {
    const v0 = Vec.empty()
    const v1 = v0.set(0, "a")
    const v2 = v1.set(1, "b")
    const v3 = v2.set(2, "c")

    assert.equal(v0.size, 0)
    assert.equal(v1.size, 1)
    assert.equal(v2.size, 2)
    assert.equal(v3.size, 3)
  })

  it("can contain a large number of indices", () => {
    const r = Vec.from(range(0, 20000))
    let iterations = 0
    for (const v of r) {
      assert.equal(v, iterations)
      iterations++
    }
  })

  it("describes throws on out of range sets", () => {
    assert.throws(() => {
      const v = Vec.of("a", "b", "c").push("d").set(14, "o")
    }, "Index 14 is out of bounds [0, 4]")
  })
})
