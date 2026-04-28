export interface HealthResponse {
  status: "ok";
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export type Status = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
}
