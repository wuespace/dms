import { z } from "@zod/zod"
import { Database } from "@db/mongo"
import { BaseModel } from "../BaseModel.ts"
import { PROCESSING_ERRORS_COLLECTION } from "../collections.ts"

export interface ProcessingError {
  id: string
  error: string
  time: Date
}

export class ProcessingErrorModel extends BaseModel<ProcessingError> {
  constructor(db: Database) {
    super(db)
  }

  override get collection() {
    return PROCESSING_ERRORS_COLLECTION
  }

  override get schema() {
    return z.object({
      id: z.string(),
      error: z.string(),
      time: z.coerce.date(),
    })
  }

  get() {
    return this._find({}, {
      time: -1,
    })
  }

  getOne(id: string) {
    return this._findOne({ id })
  }

  add(
    error: ProcessingError,
  ) {
    return this._insertOne(error)
  }
}
