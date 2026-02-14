
export enum Category {
  Deliverables = 'Deliverables',
  Pursuits = 'Pursuits',
  Proposals = 'Proposals',
  AdminWork = 'Admin Work',
  General = 'General'
}

export enum Status {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Review = 'Review',
  Completed = 'Completed'
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent'
}

export interface Task {
  id: string;
  description: string;
  client: string; // Used for "Client" in EY or "Sewa Category" in SKRM
  org: 'EY' | 'SKRM';
  category: Category;
  deadline: string; // ISO Date string
  junior: string | null;
  status: Status;
  priority: Priority;
  createdAt: number;
}

export type ViewMode = 'Today' | 'Client' | 'Category' | 'Junior';

export interface NLUResponse {
  action: 'ADD_TASK' | 'CHANGE_VIEW' | 'UNKNOWN';
  task?: Partial<Omit<Task, 'id' | 'createdAt' | 'status'>>;
  viewMode?: ViewMode;
  confirmationMessage?: string;
}

export interface ExtractedActionable {
  description: string;
  client: string;
  deadline: string;
  priority: Priority;
  category: Category;
  suggestedJunior?: string;
}

export interface FollowUpDraft {
  taskId: string;
  recipient: string;
  message: string;
  taskDescription: string;
}
