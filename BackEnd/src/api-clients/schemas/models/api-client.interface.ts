import { Types } from 'mongoose';

export interface IApiClient {
  _id?: Types.ObjectId | string;
  name: string;
  clientId: string;
  secretHash: string;
  allowedOrgIds: Types.ObjectId[];
  defaultRole: 'MEMBER' | 'VIEWER';
  ownerUserId?: Types.ObjectId;
  resetPasswordUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
