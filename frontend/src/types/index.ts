export type Task = {
  id: string;
  name: string;
  description: string;
  deadline: Date | string; // ISO date string or Date object
  priority: "low" | "middle" | "high";
  assign: string; // User ID or name
  groupId?: string; // Group ID
  status: "not-stated-yet" | "in-progress" | "done";
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
