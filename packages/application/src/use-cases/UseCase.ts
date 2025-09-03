import { Result } from '@woodie/domain'

export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<Result<TResponse>>
}

export abstract class BaseUseCase<TRequest, TResponse> implements UseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<Result<TResponse>>
}