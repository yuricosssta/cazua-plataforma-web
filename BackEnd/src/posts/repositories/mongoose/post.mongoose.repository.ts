// src/posts/repositories/mongoose/post.mongoose.repository.ts
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { IPost } from '../../schemas/models/post.interface';
import { PostRepository, PaginateOptions } from '../post.repository';
import { Post } from '../../schemas/post.schema';

export class PostMongooseRepository implements PostRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  async getAllPosts(options: PaginateOptions): Promise<IPost[]> {
    const filter: FilterQuery<Post> = {};

    if (options.organizationId && options.organizationId !== 'undefined') {
      filter.organizationId = new Types.ObjectId(options.organizationId);
    }

    return this.postModel
      .find(filter)
      .sort({ created_at: -1 })
      .skip(options.skip)
      .limit(options.limit)
      .exec();
  }

  async getTotalPostsCount(organizationId?: string): Promise<number> {
    const filter: FilterQuery<Post> = {};

    if (organizationId && organizationId !== 'undefined') {
      filter.organizationId = new Types.ObjectId(organizationId);
    }

    return this.postModel.countDocuments(filter).exec();
  }

  async searchPost(term: string): Promise<IPost[]> {
    const regex = new RegExp(term, 'i');
    return this.postModel
      .find({
        $or: [{ title: regex }, { description: regex }, { author: regex }, { content: regex }],
      })
      .exec();
  }
  
  async getPost(postId: string): Promise<IPost> {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel.findById(new Types.ObjectId(postId)).exec();
  }

  async createPost(post: IPost): Promise<IPost> {
    if (post.organizationId) {
      post.organizationId = new Types.ObjectId(post.organizationId) as any;
    }
    const createPost = new this.postModel(post);
    return await createPost.save();
  }

  async updatePost(postId: string, post: Partial<IPost>): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(postId)) return null;
    
    const updateData = Object.fromEntries(
      Object.entries(post).filter(([, value]) => value !== undefined),
    );

    return this.postModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(postId) }, 
        { $set: updateData }, 
        { new: true }
      )
      .exec();
  }

  async deletePost(postId: string): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel.findByIdAndDelete(new Types.ObjectId(postId)).exec();
  }
}