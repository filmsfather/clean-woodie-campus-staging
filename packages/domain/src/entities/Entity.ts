import { UniqueEntityID } from '../common/Identifier'

export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID
  protected props: T

  constructor(props: T, id?: UniqueEntityID) {
    this._id = id ? id : new UniqueEntityID()
    this.props = props
  }

  get id(): UniqueEntityID {
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

    return this._id.equals(entity.id)
  }
}