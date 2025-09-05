import { AssignmentService } from '@woodie/domain';
import { SupabaseAssignmentRepository } from '../SupabaseAssignmentRepository';
export class AssignmentServiceFactory {
    static instance;
    static create(supabase) {
        if (!AssignmentServiceFactory.instance) {
            const assignmentRepository = new SupabaseAssignmentRepository(supabase);
            AssignmentServiceFactory.instance = new AssignmentService(assignmentRepository);
        }
        return AssignmentServiceFactory.instance;
    }
    static getInstance() {
        return AssignmentServiceFactory.instance || null;
    }
    static reset() {
        AssignmentServiceFactory.instance = null;
    }
}
//# sourceMappingURL=AssignmentServiceFactory.js.map