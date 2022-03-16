import * as API from "./api.js"

function ReadonlyIndexedView() {}
Object.defineProperties(ReadonlyIndexedView, {
  prototype: {
    value: new Proxy(Object.prototype, {
      /**
       * @template T
       * @param {object} _target
       * @param {PropertyKey} property
       * @param {API.IndexedView<T>} receiver
       */
      get(_target, property, receiver) {
        const n = parseKey(property)
        return n != null ? receiver.get(n) : undefined
      },
    }),
  },
})

/**
 * @param {PropertyKey} key
 * @returns {number|null}
 */
const parseKey = key => (typeof key === "string" ? parseInt(key) : null)

export { ReadonlyIndexedView }
