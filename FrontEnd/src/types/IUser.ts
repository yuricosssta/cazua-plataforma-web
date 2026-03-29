//src/types/IUser.ts
export enum UserRule {
  Admin,        // 0
  Organization, // 1
  Project       // 2
}

export interface IUser {
  _id?: string; 
  id?: string;  
  email: string;
  name: string;
  password?: string; 
  isAdmin: boolean;
  rule: UserRule;
  avatarUrl?: string; 
  created_at?: Date;
  modified_at?: Date;
}