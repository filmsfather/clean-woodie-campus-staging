export interface Adapter {
  name: string
  isConnected(): Promise<boolean>
  connect(): Promise<void>
  disconnect(): Promise<void>
}

export abstract class BaseAdapter implements Adapter {
  abstract readonly name: string

  abstract isConnected(): Promise<boolean>
  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>

  protected constructor() {}
}