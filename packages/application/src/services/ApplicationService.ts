export interface ApplicationService {
  name: string
}

export abstract class BaseApplicationService implements ApplicationService {
  abstract readonly name: string

  protected constructor() {}
}