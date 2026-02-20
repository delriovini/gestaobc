import { Role } from "./roles";

export interface UserProfile {
  id: string;
  full_name: string;
  role: Role;
}
