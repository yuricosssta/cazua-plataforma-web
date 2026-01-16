export interface IOrganization {
  _id?: string; // Mongoose usa _id, o "id" virtual é opcional
  name: string;
  slug: string;
  ownerId: string; // Pode ser string ou Types.ObjectId, string é mais fácil no front
  status: 'active' | 'inactive' | 'suspended';
  settings?: Record<string, any>;
  createdAt?: Date; 
  updatedAt?: Date; 
}
