// Assignment API Module - Clean Architecture 구현
// Domain -> Application -> Infrastructure -> API 레이어 순으로 의존성 방향 준수

export * from './interfaces';
export * from './controllers';
export * from './routes';
export * from './middleware';
export * from './validation/AssignmentValidationSchemas';
export * from './errors';
export * from './jobs';

// Main Assignment Router Factory
// DI Container에서 Use Case들을 주입받아 Router 생성
export { AssignmentRouter } from './routes';