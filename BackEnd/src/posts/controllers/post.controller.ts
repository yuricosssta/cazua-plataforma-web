// src/posts/controllers/post.controller.ts
import {
  Body, Controller, DefaultValuePipe, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { PostService } from '../services/post.service';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { AuthGuard } from '../../auth/auth.guard';
import { TenantGuard } from '../../organization/guards/tenant.guard';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import { createPostSchema, CreatePostDto, updatePostSchema, UpdatePostDto } from '../validations/post.zod';
import { IPost } from '../schemas/models/post.interface';

@UseInterceptors(LoggingInterceptor)
@UseGuards(AuthGuard, TenantGuard) 
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getAllPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Req() req: any,
  ) {
    limit = limit > 100 ? 100 : limit;
    const orgId = req.organizationId || ''; 
    // const orgId = '';
    return this.postService.getAllPosts(page, limit, orgId);
  }

  @Get('search')
  async searchPost(@Query('term') term: string) {
    return this.postService.searchPost(term);
  }

  @Get(':postId')
  async getPost(@Param('postId') postId: string) {
    return this.postService.getPost(postId);
  }

  @Post()
  async createPost(
    @Body(new ZodValidationPipe(createPostSchema)) createPostDto: CreatePostDto, 
    @Req() req: any
  ) {
    return this.postService.createPost({
      ...createPostDto, 
      organizationId: req.organizationId,      
      created_at: new Date(),
      modified_at: new Date(),
      author: createPostDto.author || req.user?.name || 'Anônimo',
    } as IPost);
  }

  @Put(':postId')
  async updatePost(
    @Param('postId') postId: string,
    @Body(new ZodValidationPipe(updatePostSchema)) updatePostDto: UpdatePostDto,
    @Req() req: any
  ) {
    if (updatePostDto.author !== 'ADMIN') {
      const post = await this.postService.getPost(postId);
      if (post.author !== updatePostDto.author) {
        throw new UnauthorizedException('Você não tem permissão para editar esta postagem.');
      }
    }
    return this.postService.updatePost(postId, {
      ...updatePostDto,
      organizationId: req.organizationId,
      modified_at: new Date(),
    });
  }

  @Delete(':postId')
  async deletePost(@Param('postId') postId: string, @Req() req: any) {
    const post = await this.postService.getPost(postId);
    
    if (post.organizationId?.toString() !== req.organizationId?.toString()) {
      throw new UnauthorizedException('Você não tem permissão para excluir esta postagem.');
    }

    if (req.user?.role !== 'ADMIN' && post.author !== req.user.name) {
      throw new UnauthorizedException('Você não tem permissão para excluir esta postagem.');
    }
    
    return this.postService.deletePost(postId);
  }
}