export type Task = {
  id: number;
  title: string;
  description: string;
  deadline: Date | string; // ISO date string or Date object
  priority: "low" | "middle" | "high";
  assign?: number; // User ID or name
  assigned_user?: {
    id: number;
    user_name: string;
    picture: string;
  };
  group_id?: number; // Group ID
  status: "not-started-yet" | "in-progress" | "done";
  createdAt?: Date | string;
};
