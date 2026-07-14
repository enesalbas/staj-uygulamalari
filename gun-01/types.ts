export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export type Role = "admin" | "developer" | "intern"