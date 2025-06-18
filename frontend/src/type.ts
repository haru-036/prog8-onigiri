// type.ts
export type Task = {
  id: string;
  name: string;
  text: string;
  isCompleted: boolean;
  priority: "low" | "middle" | "high" | "未設定"; // ← "未設定" を追加！
  assignee: string;
  description: string;
  deadline: string;
  assign: string;
  status: string;
};
