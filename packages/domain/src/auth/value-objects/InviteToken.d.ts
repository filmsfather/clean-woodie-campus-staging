import { ValueObject } from '../../value-objects/ValueObject';
import { Result } from '../../common/Result';
export interface InviteTokenProps {
    value: string;
}
export declare class InviteToken extends ValueObject<InviteTokenProps> {
    private constructor();
    get value(): string;
    static create(): InviteToken;
    static createFromValue(token: string): Result<InviteToken>;
    private static generateSecureToken;
    isUrlSafe(): boolean;
}
//# sourceMappingURL=InviteToken.d.ts.map