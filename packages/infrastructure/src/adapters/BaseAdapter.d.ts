export interface Adapter {
    name: string;
    isConnected(): Promise<boolean>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
export declare abstract class BaseAdapter implements Adapter {
    abstract readonly name: string;
    abstract isConnected(): Promise<boolean>;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    protected constructor();
}
//# sourceMappingURL=BaseAdapter.d.ts.map