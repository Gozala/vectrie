import * as API from "./api.js"
function ReadonlyIndexedView() {}
Object.defineProperties(ReadonlyIndexedView, {
  prototype: {
    value: new Proxy(Object.prototype, {
      /**
       * @template T
       * @param {object} target
       * @param {PropertyKey} property
       * @param {API.ReadonlyIndexedView<T>} receiver
       */
      get(target, property, receiver) {
        const n = parseKey(property)
        return n != null ? receiver.get(n) : undefined
      },
    }),
  },
})

/**
 *
 * @param {PropertyKey} key
 * @returns {number|null}
 */
const parseKey = key => (typeof key === "string" ? parseInt(key) : null)

export { ReadonlyIndexedView }
