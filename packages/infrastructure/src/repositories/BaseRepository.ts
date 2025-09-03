import { Repository } from '@woodie/domain'

export abstract class BaseRepository<T> implements Repository<T> {
  abstract findById(id: string): Promise<T | null>
  abstract save(entity: T): Promise<void>
  abstract delete(entity: T): Promise<void>

  protected constructor() {}
}