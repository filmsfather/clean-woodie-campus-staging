import { ILogger } from '@woodie/application/common/interfaces/ILogger';
import { Result } from '@woodie/domain/common/Result';
export interface MaskingRule {
    fieldPath: string;
    maskingType: 'redact' | 'hash' | 'partial' | 'tokenize' | 'encrypt';
    condition?: (context: MaskingContext, value: any) => boolean;
    options?: {
        preserveLength?: boolean;
        visibleChars?: number;
        replaceChar?: string;
        algorithm?: string;
        key?: string;
    };
}
export interface MaskingContext {
    requesterRole: string;
    requesterId: string;
    dataOwnerId: string;
    purpose: string;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
}
export interface MaskingPolicy {
    name: string;
    description: string;
    rules: MaskingRule[];
    applicableRoles: string[];
    isActive: boolean;
    createdAt: Date;
}
export interface SensitiveDataPattern {
    name: string;
    pattern: RegExp;
    category: 'pii' | 'financial' | 'health' | 'educational' | 'authentication';
    severity: 'low' | 'medium' | 'high' | 'critical';
    defaultMasking: 'redact' | 'hash' | 'partial';
}
export declare class DataMaskingService {
    private readonly logger;
    private readonly policies;
    private readonly sensitivePatterns;
    constructor(logger: ILogger);
    maskData<T>(data: T, context: MaskingContext, policyName?: string): Promise<Result<T>>;
    maskEducationalData(data: {
        studentAnswers?: Array<{
            studentId: string;
            studentName?: string;
            email?: string;
            answer: any;
            score?: number;
        }>;
        problemContent?: {
            title: string;
            description: string;
            hints?: string[];
            solution?: string;
        };
        analytics?: {
            performanceData: any;
            behaviorData: any;
        };
    }, context: MaskingContext): Promise<Result<typeof data>>;
    detectAndMaskSensitiveData<T>(data: T, context: MaskingContext): Promise<Result<{
        maskedData: T;
        detectedPatterns: string[];
    }>>;
    classifyDataSensitivity(data: any): Promise<{
        classification: 'public' | 'internal' | 'confidential' | 'restricted';
        sensitiveFields: string[];
        recommendedPolicies: string[];
    }>;
    unmaskData<T>(maskedData: T, context: MaskingContext, unmaskingKey: string): Promise<Result<T>>;
    addMaskingPolicy(policy: MaskingPolicy): void;
    addSensitivePattern(pattern: SensitiveDataPattern): void;
    private applyMaskingRules;
    private applyCustomMaskingRules;
    private applyMaskingRule;
    private applyMaskingType;
    private expandFieldPath;
    private getNestedValue;
    private setNestedValue;
    private traverseAndMask;
    private deepClone;
    private simpleHash;
    private generateToken;
    private simpleEncrypt;
    private initializeDefaultPolicies;
    private initializeSensitivePatterns;
}
//# sourceMappingURL=DataMaskingService.d.ts.map