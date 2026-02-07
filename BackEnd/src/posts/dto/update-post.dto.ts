import { PartialType } from '@nestjs/swagger'; // Ou '@nestjs/mapped-types' se não usar Swagger
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}