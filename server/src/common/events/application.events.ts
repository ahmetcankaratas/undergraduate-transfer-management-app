/**
 * Application Event Types
 * Event-driven workflow için kullanılır
 */
export enum ApplicationEventType {
  SUBMITTED = 'application.submitted',
  OIDB_APPROVED = 'application.oidb.approved',
  OIDB_REJECTED = 'application.oidb.rejected',
  ROUTED_TO_FACULTY = 'application.routed.faculty',
  ROUTED_TO_DEPARTMENT = 'application.routed.department',
  YGK_EVALUATION_STARTED = 'application.ygk.started',
  YGK_EVALUATION_COMPLETED = 'application.ygk.completed',
  RANKED = 'application.ranked',
  WAITLISTED = 'application.waitlisted',
  FACULTY_BOARD_DECISION = 'application.faculty.board.decision',
  APPROVED = 'application.approved',
  REJECTED = 'application.rejected',
  RESULTS_PUBLISHED = 'application.results.published',
}

export interface ApplicationEvent {
  type: ApplicationEventType;
  applicationId: string;
  applicationNumber: string;
  studentId: string;
  userId?: string;
  targetFaculty: string;
  targetDepartment: string;
  timestamp: Date;
  data?: Record<string, any>;
}

/**
 * Workflow configuration for automatic routing
 */
export interface WorkflowConfig {
  autoRouteToFaculty: boolean;
  autoRouteToDepartment: boolean;
  autoStartEvaluation: boolean;
  routingDelayMinutes: number;
}

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  autoRouteToFaculty: true,
  autoRouteToDepartment: false, // Dean's Office manual routing by default
  autoStartEvaluation: false, // YGK manual start by default
  routingDelayMinutes: 0,
};
