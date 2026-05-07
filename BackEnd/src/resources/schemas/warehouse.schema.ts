//src/resources/schemas/warehouse.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WarehouseDocument = Warehouse & Document;

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization', unique: true })
  organizationId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedMembers: Types.ObjectId[];
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);