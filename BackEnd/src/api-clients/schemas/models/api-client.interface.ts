import { Types } from 'mongoose';

export interface IApiClientOwner {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
}

export interface IApiClient {
  _id?: Types.ObjectId | string;
  name: string;
  clientId: string;
  secretHash: string;
  allowedOrgIds: Types.ObjectId[];
  defaultRole: 'MEMBER' | 'VIEWER';
  ownerUserId?: Types.ObjectId | IApiClientOwner | null;
  resetPasswordUrl?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
