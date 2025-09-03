export interface InfrastructureService {
  name: string
  initialize(): Promise<void>
  cleanup(): Promise<void>
}

export abstract class BaseInfrastructureService implements InfrastructureService {
  abstract readonly name: string

  abstract initialize(): Promise<void>
  abstract cleanup(): Promise<void>

  protected constructor() {}
}