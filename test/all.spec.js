import { describe, assert, it } from "./test.js"
import * as Vec from "../src/lib.js"
import { range } from "../src/util.js"

describe("persistent API", () => {
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

      assert.equal(v1.peek(), 95)
      assert.equal(v2.peek(), 94)
    })

    it("indexed access", () => {
      const pv = Vec.from(range(0, 97))

      for (const n of range(0, 97)) {
        assert.equal(pv[n], n, `pv[${n}] == ${pv[n]} != ${n}`)
      }
      assert.equal(pv[98], undefined)

      // @ts-expect-error - no such property
      assert.equal(pv["third"], undefined)
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

  describe("pop", () => {
    it("throws on empty", () => {
      assert.throws(() => Vec.pop(Vec.empty()), "can not pop from empty")
    })

    it("pop from vec with only item", () => {
      const v1 = Vec.of(1)
      const v2 = Vec.pop(v1)

      assert.equal(Vec.count(v2), 0)
      assert.ok(v2.equals(Vec.empty()))
    })

    it("pop with fork tail", () => {
      const v1 = Vec.from(range(0, 17))
      const v2 = Vec.pop(v1)

      assert.equal(v2.size, 16)
      assert.equal([...v2], [...range(0, 16)])
      assert.equal(v1.size, 17)
      assert.equal([...v1], [...range(0, 17)])
    })

    it("pop with fork branch", () => {
      const v1 = Vec.from(range(0, 1025))
      const v2 = Vec.pop(v1)

      assert.equal(v2.size, 1024)
      assert.equal([...v2], [...range(0, 1024)])

      assert.equal(v1.size, 1025)
      assert.equal([...v1], [...range(0, 1025)])
    })

    it("fuzz pop", function () {
      this.timeout(20000)
      const array = [...range(0, 60000)]
      let vec = Vec.from(array)
      while (array.length > 0) {
        array.pop()
        vec = vec.pop()
        assert.equal(vec.size, array.length)
        assert.equal(vec[array.length], undefined)
        assert.equal(vec[array.length - 1], array[array.length - 1])

        const index = (Math.random() * array.length - 1) | 0
        assert.equal(vec[index], array[index])
      }
    })
  })

  describe("push", () => {
    it("fuzz", function () {
      this.timeout(20000)
      const max = 50000
      const array = []
      let vec = Vec.empty()
      while (array.length < max) {
        const value = Math.random()
        array.push(value)
        const v = vec.push(value)
        assert.equal(vec.size, array.length - 1)
        assert.equal(vec[array.length - 1], undefined)

        vec = v

        assert.equal(vec.size, array.length)
        assert.equal(vec[array.length], undefined)
        assert.equal(vec[array.length - 1], array[array.length - 1])

        const index = (Math.random() * array.length - 1) | 0
        assert.equal(vec[index], array[index])
      }
    })
  })

  describe("set", () => {
    it("fuzz", function () {
      this.timeout(20000)
      let n = 50000
      const array = [...range(0, n)]
      let vec = Vec.from(array)
      while (n > 0) {
        const value = Math.random()
        const index = (Math.random() * n) | 0

        assert.equal(vec.get(index), array[index])
        array[index] = value
        vec = vec.set(index, value)

        if (vec[index] !== array[index]) {
          console.log(index, vec, vec[index], array[index], value)
          vec.set(index, value)
        }
        assert.equal(vec[index], array[index])
        n--
      }
    })
  })
  describe("iteration", () => {
    const vec = Vec.of("a", "b", "c", "d")
    it("has keys method", () => {
      const keys = vec.keys()
      assert.equal(keys.next(), { value: 0, done: false })
      assert.equal([...keys], [1, 2, 3])
    })

    it("has values method", () => {
      const vals = vec.values()
      assert.equal(vals.next(), { value: "a", done: false })

      assert.equal([...vals], ["b", "c", "d"])

      assert.equal([...vec.values({ start: 2 })], ["c", "d"])
    })

    it("has entries method", () => {
      const entries = vec.entries()
      assert.equal(entries.next(), { value: [0, "a"], done: false })

      assert.equal(
        [...entries],
        [
          [1, "b"],
          [2, "c"],
          [3, "d"],
        ]
      )

      assert.equal(
        [...vec.entries({ start: 1, end: 3 })],
        [
          [1, "b"],
          [2, "c"],
        ]
      )

      assert.equal([...vec.entries({ start: 10 })], [])
    })
  })

  describe("indexed access", () => {
    it("supports indexed access", () => {
      const vec = Vec.of("a", "b", "c", "d")
      assert.equal(vec[0], "a")
      assert.equal(vec[1], "b")
      assert.equal(vec[2], "c")
      assert.equal(vec[3], "d")
      assert.equal(vec[-1], undefined)
      assert.equal(vec[4], undefined)
    })
  })

  describe("equality", () => {
    it("equal vecs", () => {
      const equal = [
        [Vec.of(1, 2, 3), Vec.of(1, 2, 3)],
        [Vec.empty(), Vec.of(1).pop()],
        [Vec.of(1), Vec.of(1)],
        [Vec.of(1, 2), Vec.conj(Vec.of(1), 2)],
        [Vec.empty(), Vec.of(1, 2, 3).clear()],
        [Vec.of(1, 2).clone(), Vec.of(1, 2)],
      ]

      for (const [left, right] of equal) {
        assert.equal(Vec.equals(left, right), true)
        assert.equal(left.equals(right), true)
        assert.equal(right.equals(left), true)
      }
    })

    it("non equal", () => {
      const data = [
        [Vec.of(1, 2, 3), Vec.of(1, 3, 2)],
        [Vec.empty(), Vec.of(1)],
        [Vec.of(1), Vec.of("one")],
      ]

      for (const [left, right] of data) {
        assert.equal(Vec.equals(left, right), false)
        assert.equal(left.equals(right), false)
        assert.equal(right.equals(left), false)
      }
    })
  })
})

describe("mutable API", () => {
  it("conj", () => {
    const pv1 = Vec.of(1, 2, 3)
    const tv1 = Vec.mutable.from(pv1)
    const tv2 = Vec.mutable.push(tv1, 4)
    const tv3 = Vec.mutable.push(tv2, 5)
    const tv4 = Vec.mutable.push(tv3, 6)
    const pv2 = Vec.seal(tv4)

    assert.equal([...pv1], [1, 2, 3])
    assert.equal([...pv2], [1, 2, 3, 4, 5, 6])
    assert.ok(tv1 === tv2)
    assert.ok(tv1 === tv3)
    assert.ok(tv1 === tv4)

    assert.throws(() => Vec.seal(tv4))
    assert.throws(() => tv1.push(4))
    assert.throws(() => Vec.mutable.push(tv2, 4))
  })

  it("pop", () => {
    const pv = Vec.from(range(0, 33))
    const tv1 = Vec.mutable.from(pv)
    const tv2 = tv1.pop()
    const tv3 = tv2.pop()

    assert.equal([...tv3], [...range(0, 31)])
    assert.ok(tv1 === tv2)
    assert.ok(tv1 === tv3)

    const pv2 = Vec.seal(tv3)
    assert.equal([...pv2], [...range(0, 31)])

    assert.throws(() => tv3.pop(), "throws after sealed")
    assert.throws(() => Vec.seal(tv1))
    assert.throws(() => Vec.mutable.pop(tv3))
    assert.throws(() => Vec.mutable.pop(pv2))
  })

  it("set", () => {
    const v1 = Vec.from(range(0, 5))
    const v2 = Vec.mutable.from(v1)

    const v3 = Vec.mutable.set(v2, 1, -1)
    const v4 = v3.set(2, -2)
    const v5 = Vec.seal(v4)

    assert.equal([...v5], [0, -1, -2, 3, 4])
    assert.equal([...v4], [0, -1, -2, 3, 4])
    assert.equal([...v1], [0, 1, 2, 3, 4])

    assert.throws(() => v2.set(3, 0), "throws after sealed")
    assert.throws(() => Vec.mutable.set(v4, 3, 0))
    assert.throws(() => Vec.seal(v3))

    assert.ok(v2 === v3)
    assert.ok(v2 === v4)
  })

  describe("iteration", () => {
    const vec = Vec.mutable.from(Vec.of("a", "b", "c", "d"))
    it("has keys method", () => {
      const keys = vec.keys()
      assert.equal(keys.next(), { value: 0, done: false })
      assert.equal([...keys], [1, 2, 3])
    })

    it("has values method", () => {
      const vals = vec.values()
      assert.equal(vals.next(), { value: "a", done: false })

      assert.equal([...vals], ["b", "c", "d"])

      assert.equal([...vec.values({ start: 2 })], ["c", "d"])
    })

    it("has entries method", () => {
      const entries = vec.entries()
      assert.equal(entries.next(), { value: [0, "a"], done: false })

      assert.equal(
        [...entries],
        [
          [1, "b"],
          [2, "c"],
          [3, "d"],
        ]
      )

      assert.equal(
        [...vec.entries({ start: 1, end: 3 })],
        [
          [1, "b"],
          [2, "c"],
        ]
      )

      assert.equal([...vec.entries({ start: 10 })], [])
    })
  })

  describe("fuzz", () => {
    it("set", function () {
      this.timeout(20000)
      let n = 50000
      const array = [...range(0, n)]
      let vec = Vec.mutable.from(Vec.from(array))
      while (n > 0) {
        const value = Math.random()
        const index = (Math.random() * n) | 0

        assert.equal(vec.get(index), array[index])
        array[index] = value
        vec = vec.set(index, value)

        if (vec[index] !== array[index]) {
          console.log(index, vec, vec[index], array[index], value)
          vec.set(index, value)
        }
        assert.equal(vec[index], array[index])
        n--
      }
    })

    it("push", function () {
      this.timeout(20000)
      const max = 50000
      const array = []
      let vec = Vec.mutable.from(Vec.empty())
      while (array.length < max) {
        const value = Math.random()
        array.push(value)
        vec = vec.push(value)

        assert.equal(vec.size, array.length)
        assert.equal(vec[array.length], undefined)
        assert.equal(vec[array.length - 1], array[array.length - 1])

        assert.equal(vec.peek(), value)

        const index = (Math.random() * array.length - 1) | 0
        assert.equal(vec[index], array[index])
      }
    })

    it("pop", function () {
      this.timeout(20000)
      const array = [...range(0, 60000)]
      let vec = Vec.mutable.from(Vec.from(array))
      while (array.length > 0) {
        array.pop()
        vec = vec.pop()
        assert.equal(vec.size, array.length)
        assert.equal(vec[array.length], undefined)
        assert.equal(vec[array.length - 1], array[array.length - 1])

        const index = (Math.random() * array.length - 1) | 0
        assert.equal(vec[index], array[index])
      }
    })
  })
})
