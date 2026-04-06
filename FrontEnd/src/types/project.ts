//src/types/project.ts

export type ProjectStatus = "DEMAND" | "PLANNING" | "EXECUTION" | "COMPLETED" | "INVALID";

export type TimelineEventType = "COMMENT" | "STATUS_CHANGE" | "DOCUMENT" | "REPORT";

export interface ProjectTimelineEvent {
  _id?: string;
  id: string;
  date: string;
  author: string;
  description: string;
  type: TimelineEventType;
};

export type TabType = ProjectStatus | "ALL" | "MINE";

export interface Project {
  id: string;
  _id?: string;
  referenceCode?: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress?: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  priorityScore?: number;
  assignedMembers?: any[];
  lastUpdate?: ProjectTimelineEvent;
  attachments?: string[];
};