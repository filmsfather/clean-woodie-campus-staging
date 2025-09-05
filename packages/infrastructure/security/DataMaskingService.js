import { Result } from '@woodie/domain/common/Result';
export class DataMaskingService {
    logger;
    policies = new Map();
    sensitivePatterns = [];
    constructor(logger) {
        this.logger = logger;
        this.initializeDefaultPolicies();
        this.initializeSensitivePatterns();
    }
    // 메인 데이터 마스킹 메서드
    async maskData(data, context, policyName = 'default') {
        try {
            this.logger.debug('Data masking started', {
                requesterRole: context.requesterRole,
                requesterId: context.requesterId,
                dataOwnerId: context.dataOwnerId,
                classification: context.classification,
                policyName
            });
            const policy = this.policies.get(policyName);
            if (!policy || !policy.isActive) {
                return Result.fail('Masking policy not found or inactive');
            }
            if (!policy.applicableRoles.includes(context.requesterRole)) {
                this.logger.warn('Role not applicable for masking policy', {
                    requesterRole: context.requesterRole,
                    policyName,
                    applicableRoles: policy.applicableRoles
                });
            }
            const maskedData = await this.applyMaskingRules(data, context, policy.rules);
            this.logger.info('Data masking completed', {
                requesterRole: context.requesterRole,
                requesterId: context.requesterId,
                policyName,
                rulesApplied: policy.rules.length
            });
            return Result.ok(maskedData);
        }
        catch (error) {
            this.logger.error('Data masking failed', {
                error: error instanceof Error ? error.message : String(error),
                requesterRole: context.requesterRole,
                policyName
            });
            return Result.fail('Data masking failed');
        }
    }
    // 교육 데이터 특화 마스킹
    async maskEducationalData(data, context) {
        const maskingRules = [];
        // 역할별 마스킹 규칙 적용
        if (context.requesterRole === 'teacher') {
            // 교사는 자신의 학생 데이터만 볼 수 있고, 다른 교사 데이터는 마스킹
            maskingRules.push({
                fieldPath: 'studentAnswers[].studentName',
                maskingType: 'partial',
                condition: (ctx, value) => ctx.requesterId !== ctx.dataOwnerId,
                options: { visibleChars: 1, replaceChar: '*' }
            });
            maskingRules.push({
                fieldPath: 'studentAnswers[].email',
                maskingType: 'partial',
                condition: (ctx, value) => ctx.requesterId !== ctx.dataOwnerId,
                options: { visibleChars: 3, replaceChar: '*' }
            });
        }
        if (context.requesterRole === 'student') {
            // 학생은 다른 학생의 정보를 볼 수 없음
            maskingRules.push({
                fieldPath: 'studentAnswers[].studentName',
                maskingType: 'redact',
                condition: (ctx, value) => ctx.requesterId !== ctx.dataOwnerId
            });
            maskingRules.push({
                fieldPath: 'studentAnswers[].email',
                maskingType: 'redact',
                condition: (ctx, value) => ctx.requesterId !== ctx.dataOwnerId
            });
            // 문제 해답은 항상 마스킹
            maskingRules.push({
                fieldPath: 'problemContent.solution',
                maskingType: 'redact'
            });
        }
        return this.applyCustomMaskingRules(data, context, maskingRules);
    }
    // 개인정보 자동 감지 및 마스킹
    async detectAndMaskSensitiveData(data, context) {
        try {
            const detectedPatterns = [];
            const maskedData = await this.deepClone(data);
            await this.traverseAndMask(maskedData, '', (path, value) => {
                if (typeof value === 'string') {
                    for (const pattern of this.sensitivePatterns) {
                        if (pattern.pattern.test(value)) {
                            detectedPatterns.push(`${pattern.name} at ${path}`);
                            // 자동 마스킹 적용
                            const masked = this.applyMaskingType(value, pattern.defaultMasking, { preserveLength: true, replaceChar: '*' });
                            this.setNestedValue(maskedData, path, masked);
                            this.logger.warn('Sensitive data detected and masked', {
                                pattern: pattern.name,
                                path,
                                severity: pattern.severity,
                                category: pattern.category
                            });
                        }
                    }
                }
            });
            return Result.ok({ maskedData, detectedPatterns });
        }
        catch (error) {
            this.logger.error('Sensitive data detection failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return Result.fail('Sensitive data detection failed');
        }
    }
    // 데이터 분류 자동화
    async classifyDataSensitivity(data) {
        const sensitiveFields = [];
        const detectedCategories = new Set();
        await this.traverseAndMask(data, '', (path, value) => {
            if (typeof value === 'string') {
                for (const pattern of this.sensitivePatterns) {
                    if (pattern.pattern.test(value)) {
                        sensitiveFields.push(path);
                        detectedCategories.add(pattern.category);
                    }
                }
            }
        });
        // 분류 결정 로직
        let classification = 'public';
        const recommendedPolicies = [];
        if (detectedCategories.has('pii') || detectedCategories.has('authentication')) {
            classification = 'restricted';
            recommendedPolicies.push('pii_protection', 'authentication_data');
        }
        else if (detectedCategories.has('educational') || detectedCategories.has('financial')) {
            classification = 'confidential';
            recommendedPolicies.push('educational_data', 'financial_data');
        }
        else if (sensitiveFields.length > 0) {
            classification = 'internal';
            recommendedPolicies.push('internal_data');
        }
        return {
            classification,
            sensitiveFields,
            recommendedPolicies
        };
    }
    // 마스킹 해제 (권한이 있는 경우에만)
    async unmaskData(maskedData, context, unmaskingKey) {
        try {
            // 관리자만 마스킹 해제 가능
            if (context.requesterRole !== 'admin') {
                return Result.fail('Insufficient privileges to unmask data');
            }
            // 실제 구현에서는 암호화된 원본 데이터를 복원
            this.logger.info('Data unmasking requested', {
                requesterId: context.requesterId,
                requesterRole: context.requesterRole,
                purpose: context.purpose
            });
            // 여기서는 마스킹 해제 로직을 시뮬레이션
            const unmaskedData = await this.deepClone(maskedData);
            return Result.ok(unmaskedData);
        }
        catch (error) {
            this.logger.error('Data unmasking failed', {
                error: error instanceof Error ? error.message : String(error),
                requesterId: context.requesterId
            });
            return Result.fail('Data unmasking failed');
        }
    }
    // 마스킹 정책 추가/수정
    addMaskingPolicy(policy) {
        this.policies.set(policy.name, policy);
        this.logger.info('Masking policy added', {
            policyName: policy.name,
            rulesCount: policy.rules.length,
            applicableRoles: policy.applicableRoles
        });
    }
    // 민감 데이터 패턴 추가
    addSensitivePattern(pattern) {
        this.sensitivePatterns.push(pattern);
        this.logger.info('Sensitive data pattern added', {
            name: pattern.name,
            category: pattern.category,
            severity: pattern.severity
        });
    }
    async applyMaskingRules(data, context, rules) {
        const maskedData = await this.deepClone(data);
        for (const rule of rules) {
            if (rule.condition && !rule.condition(context, data)) {
                continue;
            }
            await this.applyMaskingRule(maskedData, rule, context);
        }
        return maskedData;
    }
    async applyCustomMaskingRules(data, context, rules) {
        try {
            const maskedData = await this.applyMaskingRules(data, context, rules);
            return Result.ok(maskedData);
        }
        catch (error) {
            return Result.fail('Custom masking rules application failed');
        }
    }
    async applyMaskingRule(data, rule, context) {
        const fieldPaths = this.expandFieldPath(rule.fieldPath);
        for (const path of fieldPaths) {
            const value = this.getNestedValue(data, path);
            if (value !== undefined) {
                const maskedValue = this.applyMaskingType(value, rule.maskingType, rule.options);
                this.setNestedValue(data, path, maskedValue);
            }
        }
    }
    applyMaskingType(value, maskingType, options = {}) {
        const { preserveLength = true, visibleChars = 0, replaceChar = '*', algorithm = 'sha256' } = options;
        if (value === null || value === undefined) {
            return value;
        }
        const stringValue = String(value);
        switch (maskingType) {
            case 'redact':
                return '[REDACTED]';
            case 'partial':
                if (stringValue.length <= visibleChars) {
                    return stringValue;
                }
                const visible = stringValue.substring(0, visibleChars);
                const masked = replaceChar.repeat(stringValue.length - visibleChars);
                return visible + masked;
            case 'hash':
                // 실제 구현에서는 crypto 라이브러리 사용
                return `[HASH:${this.simpleHash(stringValue)}]`;
            case 'tokenize':
                // 실제 구현에서는 토큰화 시스템 사용
                return `[TOKEN:${this.generateToken()}]`;
            case 'encrypt':
                // 실제 구현에서는 암호화 라이브러리 사용
                return `[ENCRYPTED:${this.simpleEncrypt(stringValue, options.key || 'default')}]`;
            default:
                return preserveLength
                    ? replaceChar.repeat(stringValue.length)
                    : '[MASKED]';
        }
    }
    expandFieldPath(fieldPath) {
        // 배열 표기법 [].field를 실제 인덱스로 확장
        if (fieldPath.includes('[]')) {
            // 실제 구현에서는 데이터 구조를 분석하여 실제 인덱스로 변환
            return [fieldPath.replace('[]', '[0]')]; // 간단한 예시
        }
        return [fieldPath];
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            if (key.includes('[') && key.includes(']')) {
                const [arrayKey, indexStr] = key.split('[');
                const index = parseInt(indexStr.replace(']', ''));
                return current?.[arrayKey]?.[index];
            }
            return current?.[key];
        }, obj);
    }
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (key.includes('[') && key.includes(']')) {
                const [arrayKey, indexStr] = key.split('[');
                const index = parseInt(indexStr.replace(']', ''));
                current = current[arrayKey][index];
            }
            else {
                current = current[key];
            }
        }
        const lastKey = keys[keys.length - 1];
        if (lastKey.includes('[') && lastKey.includes(']')) {
            const [arrayKey, indexStr] = lastKey.split('[');
            const index = parseInt(indexStr.replace(']', ''));
            current[arrayKey][index] = value;
        }
        else {
            current[lastKey] = value;
        }
    }
    async traverseAndMask(obj, path, callback) {
        if (obj === null || obj === undefined) {
            return;
        }
        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    const currentPath = path ? `${path}[${i}]` : `[${i}]`;
                    await this.traverseAndMask(obj[i], currentPath, callback);
                }
            }
            else {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    callback(currentPath, value);
                    await this.traverseAndMask(value, currentPath, callback);
                }
            }
        }
        else {
            callback(path, obj);
        }
    }
    async deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    simpleHash(value) {
        // 실제 구현에서는 crypto.createHash 사용
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            const char = value.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36).substring(0, 8);
    }
    generateToken() {
        return Math.random().toString(36).substring(2, 15);
    }
    simpleEncrypt(value, key) {
        // 실제 구현에서는 적절한 암호화 알고리즘 사용
        return Buffer.from(value + key).toString('base64').substring(0, 16);
    }
    initializeDefaultPolicies() {
        const studentDataPolicy = {
            name: 'student_data_protection',
            description: 'Protect student personal and educational data',
            applicableRoles: ['teacher', 'student', 'admin'],
            isActive: true,
            createdAt: new Date(),
            rules: [
                {
                    fieldPath: 'email',
                    maskingType: 'partial',
                    condition: (context) => context.requesterRole !== 'admin',
                    options: { visibleChars: 3, replaceChar: '*' }
                },
                {
                    fieldPath: 'phone',
                    maskingType: 'partial',
                    condition: (context) => context.requesterRole === 'student',
                    options: { visibleChars: 4, replaceChar: 'X' }
                },
                {
                    fieldPath: 'studentId',
                    maskingType: 'hash',
                    condition: (context) => context.requesterId !== context.dataOwnerId
                }
            ]
        };
        const teacherDataPolicy = {
            name: 'teacher_data_protection',
            description: 'Protect teacher personal information',
            applicableRoles: ['teacher', 'student', 'admin'],
            isActive: true,
            createdAt: new Date(),
            rules: [
                {
                    fieldPath: 'personalEmail',
                    maskingType: 'redact',
                    condition: (context) => context.requesterRole === 'student'
                },
                {
                    fieldPath: 'salary',
                    maskingType: 'redact',
                    condition: (context) => context.requesterRole !== 'admin'
                }
            ]
        };
        this.policies.set('student_data_protection', studentDataPolicy);
        this.policies.set('teacher_data_protection', teacherDataPolicy);
        this.policies.set('default', studentDataPolicy);
    }
    initializeSensitivePatterns() {
        const patterns = [
            {
                name: 'email',
                pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
                category: 'pii',
                severity: 'medium',
                defaultMasking: 'partial'
            },
            {
                name: 'phone_number',
                pattern: /\b\d{3}-?\d{3,4}-?\d{4}\b/,
                category: 'pii',
                severity: 'medium',
                defaultMasking: 'partial'
            },
            {
                name: 'student_id',
                pattern: /\b[0-9]{8,12}\b/,
                category: 'educational',
                severity: 'high',
                defaultMasking: 'hash'
            },
            {
                name: 'korean_name',
                pattern: /\b[가-힣]{2,4}\b/,
                category: 'pii',
                severity: 'high',
                defaultMasking: 'partial'
            },
            {
                name: 'password',
                pattern: /(password|pwd|pass)[\s]*[:=][\s]*\S+/i,
                category: 'authentication',
                severity: 'critical',
                defaultMasking: 'redact'
            },
            {
                name: 'api_key',
                pattern: /(api[_-]?key|access[_-]?token)[\s]*[:=][\s]*[A-Za-z0-9-._~+/]+=*/i,
                category: 'authentication',
                severity: 'critical',
                defaultMasking: 'redact'
            }
        ];
        this.sensitivePatterns.push(...patterns);
    }
}
//# sourceMappingURL=DataMaskingService.js.map