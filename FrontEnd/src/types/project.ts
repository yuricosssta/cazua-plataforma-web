//src/types/project.ts

export type ProjectStatus = "DEMAND" | "PLANNING" | "EXECUTION" | "COMPLETED" | "INVALID";

export interface ProjectTimelineEvent {
  id: string;
  date: string;
  author: string;
  description: string;
  type: "COMMENT" | "STATUS_CHANGE" | "DOCUMENT" | "REPORT";
};

export type TabType = ProjectStatus | "ALL" | "MINE";

export interface Project {
  id: string;
  referenceCode?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  location: string;
  startDate?: string;
  endDate?: string;
  priorityScore?: number;
  assignedMembers?: any[];
  lastUpdate: ProjectTimelineEvent;
  attachments: string[];
};