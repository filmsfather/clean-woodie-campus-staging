export abstract class ValueObject<T> {
  protected readonly props: T

  constructor(props: T) {
    this.props = Object.freeze({ ...props })
  }

  equals(valueObject: ValueObject<T>): boolean {
    if (valueObject === null || valueObject === undefined) {
      return false
    }

    if (this === valueObject) {
      return true
    }

    if (!(valueObject instanceof ValueObject)) {
      return false
    }

    return this.shallowEqual(this.props, valueObject.props)
  }

  private shallowEqual(object1: any, object2: any): boolean {
    const keys1 = Object.keys(object1)
    const keys2 = Object.keys(object2)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (object1[key] !== object2[key]) {
        return false
      }
    }

    return true
  }

  toString(): string {
    return JSON.stringify(this.props)
  }
}