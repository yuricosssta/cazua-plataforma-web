//src/posts/controllers/post.controller.ts

import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from '../services/post.service';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { AuthGuard } from '../../auth/auth.guard';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { TenantGuard } from '../../organization/guards/tenant.guard';

@UseInterceptors(LoggingInterceptor)
// @UseGuards(AuthGuard, TenantGuard) // Ativar mais tarde
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard, TenantGuard)
  @Get()
  async getAllPosts(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // @Query('organizationId') organizationId?: string, 
  @Req() req: any,
  ) {
    if (limit > 100) {
      limit = 100;
    }

    const orgId = req.organizationId || ''; 
    // console.log(`Buscando posts blindados para a Organização: ${orgId}`);
    console.log(`Buscando posts -> Page: ${page}, Limit: ${limit}, Org: ${orgId}`);
    return this.postService.getAllPosts(page, limit, orgId);
  }

  @Get('search')
  async searchPost(@Query('term') term: string) {
    return this.postService.searchPost(term);
  }

  @UseGuards(AuthGuard, TenantGuard)
  @Get(':postId')
  async getPost(@Param('postId') postId: string) {
    return this.postService.getPost(postId);
  }

  @UseGuards(AuthGuard, TenantGuard)
  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDto, 
    @Req() req: any
  ) {
    const orgId = req.organizationId;    
    console.log('Dados recebidos (DTO):', createPostDto);

    return this.postService.createPost({
      ...createPostDto, 
      organizationId: orgId,      
      created_at: new Date(),
      modified_at: new Date(),
      author: createPostDto.author || req.user?.name || 'Anônimo',
    });
  }

  @UseGuards(AuthGuard, TenantGuard)
  @Put(':postId')
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: any
  ) {
    const orgId = req.organizationId;
    // Atualiza apenas se for o autor ou um ADMIN
     if (updatePostDto.author !== 'ADMIN') {
      const post = await this.postService.getPost(postId);
      if (post.author !== updatePostDto.author) {
        throw new UnauthorizedException('Você não tem permissão para editar esta postagem.');
      }
    }
    return this.postService.updatePost(postId, {
      ...updatePostDto,
      organizationId: orgId,
      modified_at: new Date(), // Atualiza a data de modificação automaticamente
    });
  }

  @UseGuards(AuthGuard, TenantGuard)
  @Delete(':postId')
  async deletePost(@Param('postId') postId: string, @Req() req: any) {
    // Apaga ser for ADMIN da organização
    const orgId = req.organizationId;
    const post = await this.postService.getPost(postId);
    
    if (post.organizationId !== orgId) {
      throw new UnauthorizedException('Você não tem permissão para excluir esta postagem.');
    };
    // Apaga apenas se for o autor ou um ADMIN
    if (req.user?.role !== 'ADMIN') {
      
      if (post.author !== req.user.name) {
        throw new UnauthorizedException('Você não tem permissão para excluir esta postagem.');
      }
    }
    
    return this.postService.deletePost(postId);
  }
}



// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   HttpStatus,
//   Param,
//   ParseIntPipe,
//   Post,
//   Put,
//   Query,
//   UnauthorizedException,
//   UseGuards,
//   UseInterceptors,
//   UsePipes,
// } from '@nestjs/common';
// import { PostService } from '../services/post.service';
// import { z } from 'zod';
// import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
// import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
// import { AuthGuard } from '../../auth/auth.guard';
// import { CreatePostDto } from '../dto/create-post.dto';


// const createPostSchema = z.object({
//   title: z.string(),
//   description: z.string(),
//   content: z.string(),
//   created_at: z.coerce.date().optional(),//z.date().optional(),
//   modified_at: z.coerce.date().optional(),//z.date().optional(),
//   image: z.string().optional(),
//   author: z.string().optional(),
//   published: z.boolean().optional(),
//   tags: z.array(z.string()).optional(),
//   categories: z.array(z.string()).optional(),

// });

// const updatePostSchema = z.object({
//   title: z.string(),
//   description: z.string(),
//   content: z.string(),
//   modified_at: z.coerce.date().optional(),//z.date().optional(),
//   image: z.string().optional(),
//   author: z.string().optional(),
//   published: z.boolean().optional(),
//   tags: z.array(z.string()).optional(),
//   categories: z.array(z.string()).optional(),
// });

// type CreatePost = z.infer<typeof createPostSchema>;
// type UpdatePost = z.infer<typeof updatePostSchema>;

// const SwaggerCreatePostSchema = { 
//   schema: {
//     type: 'object',
//     properties: {
//       title: { type: 'string', example: 'Teste postagem' },
//       description: { type: 'string', example: 'Descrição da postagem teste' },
//       content: { type: 'string', example: 'Conteudo da postagem teste' },

//     },
//     required: ['title', 'description', 'content'],
//   },
// };

// @UseInterceptors(LoggingInterceptor)
// @Controller('posts')
// export class PostController {
//   constructor(private readonly postService: PostService) { }
//   @Get()
//   async getAllPosts(
//     // Captura 'page' e 'limit' da URL. Define valores padrão se não forem fornecidos.
//     // ParseIntPipe converte a string da URL para número.
//     @Query('page', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST, optional: true })) page: number = 1,
//     @Query('limit', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST, optional: true })) limit: number = 10,
//   ) {
//     // Garante que o limite não seja excessivo
//     if (limit > 100) {
//       limit = 100;
//     }
//     return this.postService.getAllPosts(page, limit);
//   }


//   @Get('search')
//   async searchPost(@Query('term') term: string) {
//     return this.postService.searchPost(term);
//   }

//   @Get(':postId')
//   async getPost(@Param('postId') postId: string) {
//     return this.postService.getPost(postId);
//   }

//   @UseGuards(AuthGuard)
//   @Post()
//   async createPost(@Body() createPostDto: CreatePostDto) {    
//     console.log('Dados recebidos (DTO):', createPostDto);

//     return this.postService.createPost({
//       ...createPostDto,      
//       created_at: new Date(),
//       modified_at: new Date(),
      
//       // Se o author não vier do DTO, você pode pegar do request.user aqui futuramente
//       // author: req.user.name 
//     });
//   }

//   @UseGuards(AuthGuard)
//   @Put(':postId')
//   async updatePost(
//     @Param('postId') postId: string,
//     @Body(new ZodValidationPipe(updatePostSchema))
//     { title, description, content, modified_at, image, author, published }: UpdatePost,
//   ) {
//     return this.postService.updatePost(postId, { title, description, content, modified_at, image, author, published });
//   }

//   @UseGuards(AuthGuard)
//   @Delete(':postId')
//   async deletePost(@Param('postId') postId: string) {
//     return this.postService.deletePost(postId);
//   }
// }
