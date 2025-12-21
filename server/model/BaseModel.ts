import type { ZodSchema } from "@zod/zod"
import type { Database } from "@db/mongo"
import {
  type AsyncResult,
  type Result,
  wrapAsync,
  zParseResult,
} from "../result.ts"

/**
 * Base class for all MongoDB collection model classes.
 *
 * This class provides basic CRUD operations for MongoDB collections.
 * It automatically parses data using a Zod schema and handles errors.
 *
 * Any operations that can fail have a return type of {@link Result} or {@link AsyncResult}.
 */
export abstract class BaseModel<T extends object> {
  /**
   * The name of the collection in the database.
   */
  abstract get collection(): string

  /**
   * The Zod schema used to validate and parse data.
   * This schema is used to parse data when reading from the database.
   * It must not process default values, but describe the actual data structure.
   */
  abstract get schema(): ZodSchema<T>

  /**
   * Creates a new BaseModel instance.
   * @param db the MongoDB database instance.
   * This instance is used to interact with the database.
   * It can also be used to perform operations not covered by the functions in this class.
   */
  constructor(protected readonly db: Database) {}

  /**
   * Parses the given data using the Zod schema.
   * @param data the data to parse
   * @protected
   */
  protected _parse(data: object): Result<T, Error> {
    return zParseResult(this.schema, data)
  }

  /**
   * Parses an array of data using the Zod schema.
   * @param data the data to parse
   * @protected
   */
  protected _parseMultiple(data: object[]): Result<T[], Error> {
    return zParseResult(this.schema.array(), data)
  }

  /**
   * Finds documents in the collection that match the given query.
   * @param query the query to match documents against.
   * It Can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @param sorter an optional query to sort the results
   * @returns an array of documents that match the query
   * @protected
   */
  protected async _find(
    query: Query | Query[],
    sorter?: Query,
  ): AsyncResult<T[], Error> {
    let dbQuery = this.db
      .collection(this.collection)
      .find(this._preprocessQueries(query))

    if (sorter) {
      dbQuery = dbQuery.sort(sorter)
    }

    const [dbResult, dbError] = await this._toResult(dbQuery.toArray())

    if (dbError) {
      return [null, dbError]
    }

    return this._parseMultiple(dbResult)
  }

  /**
   * Finds documents in the collection that match the given query.
   * This method returns a paginated result.
   * @param query the query to match documents against.
   * This can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @param page the page number to retrieve
   * @param perPage the number of documents per page
   * @param sorter an optional query to sort the results
   * @returns an array of documents that match the query
   * @protected
   */
  protected async _findPaginated(
    query: Query | Query[],
    page: number,
    perPage: number,
    sorter?: Query,
  ): AsyncResult<T[], Error> {
    let dbQuery = this.db
      .collection(this.collection)
      .find(this._preprocessQueries(query))

    if (sorter) {
      dbQuery = dbQuery.sort(sorter)
    }

    const [dbResult, dbError] = await this._toResult(
      dbQuery.skip(page * perPage).limit(perPage).toArray(),
    )

    if (dbError) {
      return [null, dbError]
    }

    return this._parseMultiple(dbResult)
  }

  /**
   * Finds a single document in the collection that matches the given query.
   * @param query the query to match documents against.
   * This can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @param sorter an optional query to sort the results
   * @returns the document that matches the query
   * If no document is found, an error is returned.
   * @protected
   */
  protected async _findOne(
    query: Query | Query[],
    sorter?: Query,
  ): AsyncResult<T, Error> {
    const dbQuery = this.db
      .collection(this.collection)
      .findOne(this._preprocessQueries(query), { sort: sorter })

    const [dbResult, dbError] = await this._toResult(
      dbQuery,
    )

    if (dbError) {
      return [null, dbError]
    }

    if (!dbResult) {
      return [
        null,
        new Error("Document not found", { cause: { query, sorter } }),
      ]
    }

    return this._parse(dbResult)
  }

  /**
   * Finds a single document in the collection that matches the given query
   * and deletes it.
   * @param query the query to match documents against.
   * This can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @param failIfNotFound whether to fail if no document is found
   * @returns the number of documents deleted.
   * If no document is found and `failIfNotFound` is `true`, an error is returned.
   * Otherwise, if no document is found, the result is `0`.
   * @protected
   */
  protected async _deleteOne(
    query: Query | Query[],
    failIfNotFound = true,
  ): AsyncResult<number, Error> {
    const [result, error] = await this._toResult(
      this.db.collection(this.collection).deleteOne(
        this._preprocessQueries(query),
      ),
    )

    if (error) {
      return [null, error]
    }

    if (result === 0 && failIfNotFound) {
      return [
        null,
        new Error("Document not found", { cause: { query, result } }),
      ]
    }

    return [result, null]
  }

  /**
   * Counts the number of documents in the collection that match the given query.
   * @param query the query to match documents against.
   * This can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @returns the number of documents that match the query.
   * If an error occurs, the error is returned.
   * @protected
   */
  protected async _count(
    query: Query | Query[],
  ): AsyncResult<number, Error> {
    const [result, error] = await this._toResult(
      this.db.collection(this.collection).countDocuments(
        this._preprocessQueries(query),
      ),
    )

    if (error) {
      return [null, error]
    }

    return [result, null]
  }

  /**
   * Checks if a document exists in the collection that matches the given query.
   * @param query the query to match documents against.
   * This can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @returns `true` if a document exists that matches the query, `false` otherwise.
   * If an error occurs, the error is returned.
   * @protected
   */
  protected async _exists(
    query: Query | Query[],
  ): AsyncResult<boolean, Error> {
    const [result, error] = await this._count(this._preprocessQueries(query))

    if (error) {
      return [null, error]
    }

    return [result > 0, null]
  }

  /**
   * Inserts a single document into the collection.
   * @param data the data to insert
   * @returns the inserted document.
   * If an error occurs, the error is returned.
   * @protected
   */
  protected async _insertOne(
    data: T,
  ): AsyncResult<T, Error> {
    const [_result, error] = await this._toResult(
      this.db.collection(this.collection).insertOne(data),
    )

    if (error) {
      return [null, error]
    }

    return [data, null]
  }

  /**
   * Updates documents in the collection that match the given query.
   * @param query the query to match documents against.
   * This can be a single query object or an array of query objects.
   * If an array is provided, the queries are combined using the `$and` operator.
   * @param update the value with which to update the documents
   * @param failIfNotFound whether to fail if no document is found that matches the query
   * @returns the number of documents updated.
   * If no document is found and `failIfNotFound` is `true`, an error is returned.
   * Otherwise, if no document is found, the result is `0`.
   * @protected
   */
  protected async _update(
    query: Query | Query[],
    update: Partial<T>,
    failIfNotFound = false,
  ): AsyncResult<number, Error> {
    const [result, error] = await this._toResult(
      this.db.collection(this.collection).updateMany(
        this._preprocessQueries(query),
        update,
      ),
    )

    if (error) {
      return [null, error]
    }

    if (result.matchedCount === 0 && failIfNotFound) {
      return [
        null,
        new Error("No matching documents", { cause: { query, update } }),
      ]
    }

    return [result.modifiedCount, null]
  }

  /**
   * Combines multiple queries into a single query object if necessary.
   * Queries are combined using the `$and` operator.
   * @param queries the query or multiple (array) queries to be preprocessed
   * @returns a single query object
   */
  protected _preprocessQueries(queries: Query | Query[]): Query {
    if (Array.isArray(queries)) {
      return { $and: queries }
    }
    return queries
  }

  /**
   * Converts a promise to an {@link AsyncResult}.
   * @param promise the promise to convert to an AsyncResult
   * @returns an {@link AsyncResult} containing the result of the promise
   */
  protected _toResult<T>(promise: Promise<T>): AsyncResult<T, Error> {
    return wrapAsync(promise)
  }
}

/**
 * A query object used to match documents in a MongoDB collection.
 */
export type Query = object
