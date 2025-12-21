import { z, ZodSchema } from "@zod/zod"
export type Result<T, E> = readonly [T, null] | readonly [null, E]
export type AsyncResult<T, E> = Promise<Result<T, E>>

export function zParseResult<T extends ZodSchema>(
  schema: T,
  input: unknown,
): Result<z.infer<T>, Error> {
  const result = schema.safeParse(input)
  if (result.success) {
    return [result.data, null]
  }
  return [null, result.error]
}

/**
 * Wraps a promise in an AsyncResult
 * @param promise the promise to wrap
 * @returns an AsyncResult that either holds
 * - the result of the promise and the error as null
 * - null and the error if the promise rejects
 */
export async function wrapAsync<T>(
  promise: PromiseLike<T>,
): AsyncResult<T, Error> {
  try {
    return [await promise, null]
  } catch (error) {
    if (error instanceof Error) {
      return [null, error]
    }
    return [null, new Error("Unknown error (see cause)", { cause: error })]
  }
}

/**
 * Wraps a function in a Result
 * @param fn the function to wrap
 * @returns a Result that either holds
 * - the function's return value and the error as null
 * - null and the error if the function throws
 */
export function wrap<T>(
  fn: () => T,
): Result<T, Error> {
  try {
    return [fn(), null]
  } catch (error) {
    if (error instanceof Error) {
      return [null, error]
    }
    return [null, new Error("Unknown error (see cause)", { cause: error })]
  }
}

/**
 * Unwraps a Result
 * @param result the Result to unwrap
 * @returns the value if the Result isn't an error
 * @throws the error if the Result is an error
 */

export function unwrap<T, E>(
  result: Result<T, E>,
): T {
  if (result[1] !== null) {
    throw result[1]
  }
  return result[0] as T
}

/**
 * Unwraps an AsyncResult
 * @param result the AsyncResult to unwrap
 * @returns a promise that resolves to the value if the AsyncResult isn't an error
 * @throws the error if the AsyncResult is an error
 */
export function unwrapAsync<T, E>(
  result: AsyncResult<T, E>,
): Promise<T> {
  return result.then((res) => {
    if (res[1] !== null) {
      throw res[1]
    }
    return res[0] as T
  })
}
