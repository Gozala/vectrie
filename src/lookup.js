import * as API from "./api.js"
import { leavesFor, MASK } from "./core.js"

/**
 * @template T
 * @template [U=undefined]
 
 * @param {API.PersistentVector<T>} self
 * @param {number} n 
 * @param {U} [notFound=undefined]
 * @returns {T|U}
 */
export const nth = (self, n, notFound = undefined) =>
  n >= 0 && n < self.size
    ? leavesFor(self, n)[n & MASK]
    : /** @type {U} */ (notFound)

export const get = nth

/**
 * @template T, M
 * @template [U=undefined]
 
 * @param {API.PersistentVector<T>} self
 * @param {U} [notFound=undefined]
 * @returns {T|U}
 */
export const peek = (self, notFound = undefined) =>
  nth(self, self.size - 1, notFound)
