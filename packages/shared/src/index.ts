export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BaseJob {
  id: string;
  name: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
