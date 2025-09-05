import type { ILogger } from '../../common/interfaces/ILogger';
export declare class MockLogger {
    error: import("vitest").Mock<any, any>;
    warn: import("vitest").Mock<any, any>;
    info: import("vitest").Mock<any, any>;
    debug: import("vitest").Mock<any, any>;
    trace: import("vitest").Mock<any, any>;
    time: import("vitest").Mock<any, any>;
    timeEnd: import("vitest").Mock<any, any>;
    log: import("vitest").Mock<any, any>;
    child: import("vitest").Mock<[], MockLogger>;
}
export declare const createMockLogger: () => ILogger;
//# sourceMappingURL=MockLogger.d.ts.map