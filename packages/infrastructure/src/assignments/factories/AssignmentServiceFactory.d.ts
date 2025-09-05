import { SupabaseClient } from '@supabase/supabase-js';
import { AssignmentService } from '@woodie/domain';
export declare class AssignmentServiceFactory {
    private static instance;
    static create(supabase: SupabaseClient): AssignmentService;
    static getInstance(): AssignmentService | null;
    static reset(): void;
}
//# sourceMappingURL=AssignmentServiceFactory.d.ts.map