import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true, _id: false })
export class Counter {
    // O _id será a chave única da fila (Ex: DEMAND_65abc123_202603)
    @Prop({ type: String, required: true })
    _id: string;

    // A sequência numérica
    @Prop({ required: true, default: 0 })
    seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);