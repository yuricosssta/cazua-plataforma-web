export interface IOrganizationMember {
  _id?: string;
  organizationId: string; // No front trabalhamos com string, não ObjectId
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  createdAt?: Date;
  updatedAt?: Date;
  
  // Opcional: Se você fizer o "populate" ao buscar, virá o objeto completo
  // organization?: IOrganization;
  // user?: IUser;
}