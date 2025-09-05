import { vi } from 'vitest';
export class MockLogger {
    error = vi.fn();
    warn = vi.fn();
    info = vi.fn();
    debug = vi.fn();
    trace = vi.fn();
    time = vi.fn();
    timeEnd = vi.fn();
    log = vi.fn();
    child = vi.fn(() => new MockLogger());
}
export const createMockLogger = () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    log: vi.fn(),
    child: vi.fn(() => createMockLogger())
});
//# sourceMappingURL=MockLogger.js.map