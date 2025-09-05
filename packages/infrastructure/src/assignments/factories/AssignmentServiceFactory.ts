import { SupabaseClient } from '@supabase/supabase-js';
import { AssignmentService } from '@woodie/domain';
import { SupabaseAssignmentRepository } from '../SupabaseAssignmentRepository';

export class AssignmentServiceFactory {
  private static instance: AssignmentService;

  static create(supabase: SupabaseClient): AssignmentService {
    if (!AssignmentServiceFactory.instance) {
      const assignmentRepository = new SupabaseAssignmentRepository(supabase);
      AssignmentServiceFactory.instance = new AssignmentService(assignmentRepository);
    }
    return AssignmentServiceFactory.instance;
  }

  static getInstance(): AssignmentService | null {
    return AssignmentServiceFactory.instance || null;
  }

  static reset(): void {
    AssignmentServiceFactory.instance = null as any;
  }
}