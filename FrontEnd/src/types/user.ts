//src/types/IUser.ts
export type RoleType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface IUser {
  _id: string; 
  id?: string;  
  email: string;
  name: string;
  password?: string; 
  isAdmin: boolean;
  role: RoleType;
  avatarUrl?: string; 
  created_at?: Date;
  modified_at?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}