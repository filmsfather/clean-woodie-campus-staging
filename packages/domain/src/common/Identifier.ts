export class Identifier<T> {
  constructor(private value: T) {
    this.value = value
  }

  equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false
    }
    if (!(id instanceof this.constructor)) {
      return false
    }
    return id.toValue() === this.value
  }

  toString() {
    return String(this.value)
  }

  toValue(): T {
    return this.value
  }
}

export class UniqueEntityID extends Identifier<string | number> {
  constructor(id?: string | number) {
    super(id ? id : UniqueEntityID.generateId())
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}