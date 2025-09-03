export abstract class Entity<T> {
  protected readonly _id: T

  constructor(id: T) {
    this._id = id
  }

  get id(): T {
    return this._id
  }

  equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false
    }

    if (this === entity) {
      return true
    }

    if (!(entity instanceof Entity)) {
      return false
    }

    return this._id === entity.id
  }
}