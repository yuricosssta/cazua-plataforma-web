//src/summary/schemas/rell.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IRells } from './models/rell.interface';
import mongoose, { HydratedDocument } from 'mongoose';

export type RellsDocument = HydratedDocument<IRells>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } })
export class Rells implements IRells {

    @Prop({ type: mongoose.Schema.Types.ObjectId })
    id?: string;
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: false,
        index: true
    })
    organizationId: string;
    @Prop({ required: true })
    tema: string;
    @Prop()
    publico_alvo: string;
    @Prop({ required: true })
    conteudo_tipo: string;
    @Prop({ required: true })
    linha_editorial: string;
    @Prop({ required: true })
    objetivo: string;
    @Prop({ required: true })
    duracao: string;
    @Prop({ required: true })
    tom_voz: string;
    @Prop({ required: true })
    saida: string;
    @Prop({ required: true })
    rascunho: string;
    @Prop()
    created_at?: Date;
    @Prop()
    modified_at?: Date;
    @Prop()
    image?: string;
    @Prop({ type: String, required: false })
    author?: string;
    @Prop()
    published?: boolean;
}

export const RellsSchema = SchemaFactory.createForClass(Rells);
