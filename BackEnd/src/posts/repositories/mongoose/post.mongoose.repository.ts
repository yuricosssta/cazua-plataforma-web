//src/post/repositories/mongoose/post.mongoose.repository.ts

import { IPost } from '../../schemas/models/post.interface';
import { PostRepository, PaginateOptions } from '../post.repository'; // Importando a interface do local correto
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../../schemas/post.schema';
import { Model, FilterQuery } from 'mongoose';

export class PostMongooseRepository implements PostRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) { }

  getAllPosts(options: PaginateOptions): Promise<IPost[]> {
    // Monta o filtro dinamicamente
    const filter: FilterQuery<Post> = {};

    // Se o organizationId vier, adiciona ao filtro.
    if (options.organizationId && options.organizationId == 'undefined') {
      filter.organizationId = options.organizationId;
    }

    return this.postModel
      .find(filter)
      .sort({ created_at: -1 })
      .skip(options.skip)
      .limit(options.limit)
      .exec();
  }

  // Função para contar o total de documentos (Considerando o filtro)
  getTotalPostsCount(organizationId?: string): Promise<number> {
    const filter: FilterQuery<Post> = {};

    if (organizationId && organizationId == 'undefined') {
      filter.organizationId = organizationId;
    }

    return this.postModel.countDocuments(filter).exec();
  }

  searchPost(term: string): Promise<IPost[]> {
    const regex = new RegExp(term, 'i');
    // Nota: Futuramente você pode querer adicionar o organizationId aqui também
    // para buscar posts apenas dentro da empresa atual.
    return this.postModel
      .find({
        $or: [{ title: regex }, { description: regex }, { author: regex }, { content: regex }],
      })
      .exec();
  }
  
  getPost(postId: string): Promise<IPost> {
    return this.postModel.findById(postId).exec();
  }

  async createPost(post: IPost): Promise<IPost> {
    const createPost = new this.postModel(post);
    console.log('Post criado dentro do post.mongoose.repository: ', createPost);
    return await createPost.save(); // Agora retorna o objeto salvo
  }

  async updatePost(
    postId: string,
    post: Partial<IPost>,
  ): Promise<IPost | null> {
    const updateData = Object.fromEntries(
      Object.entries(post).filter(([, value]) => value !== undefined),
    );

    const result = await this.postModel
      .findOneAndUpdate({ _id: postId }, { $set: updateData }, { new: true })
      .exec();

    return result;
  }

  async deletePost(postId: string): Promise<IPost | null> {
    const result = this.postModel.findByIdAndDelete({ _id: postId }).exec();
    return result;
  }
}

// import { IPost } from '../../schemas/models/post.interface';
// import { PostRepository } from '../post.repository';
// import { InjectModel } from '@nestjs/mongoose';
// import { Post } from '../../schemas/post.schema';
// import { Model } from 'mongoose';

// // Interface para definir os parâmetros de paginação
// export interface PaginateOptions {
//   limit: number;
//   skip: number;
// }

// export class PostMongooseRepository implements PostRepository {
//   constructor(@InjectModel(Post.name) private postModel: Model<Post>) { }

//   // getAllPosts(): Promise<IPost[]> {
//   //   return this.postModel.find({});
//   // }
//   getAllPosts(options: PaginateOptions): Promise<IPost[]> {
//     return this.postModel
//       .find({})
//       .sort({ created_at: -1 }) // Ordena pelos mais recentes primeiro
//       .skip(options.skip)       // Pula os documentos das páginas anteriores
//       .limit(options.limit)     // Limita o número de resultados
//       .exec();
//   }

//   // Função para contar o total de documentos
//   getTotalPostsCount(): Promise<number> {
//     return this.postModel.countDocuments({}).exec();
//   }

//   searchPost(term: string): Promise<IPost[]> {
//     const regex = new RegExp(term, 'i');
//     return this.postModel
//       .find({
//         $or: [{ title: regex }, { description: regex }, { author: regex }, { content: regex }],
//       })
//       .exec();
//   }
  
//   getPost(postId: string): Promise<IPost> {
//     return this.postModel.findById(postId).exec();
//   }

//   async createPost(post: IPost): Promise<void> {
//     const createPost = new this.postModel(post);
//     console.log('Post criado dentro do post.mongoose.repository: ', createPost);
//     await createPost.save();
//   }

//   async updatePost(
//     postId: string,
//     post: Partial<IPost>,
//   ): Promise<IPost | null> {
//     const updateData = Object.fromEntries(
//       Object.entries(post).filter(([, value]) => value !== undefined),
//     );

//     const result = await this.postModel
//       .findOneAndUpdate({ _id: postId }, { $set: updateData }, { new: true })
//       // .findOneAndUpdate({ id: postId }, { $set: updateData }, { new: true }) 
//       .exec();

//     return result;
//   }
//   async deletePost(postId: string): Promise<IPost | null> {
//     const result = this.postModel.findByIdAndDelete({ _id: postId }).exec();
//     // const result = this.postModel.findByIdAndDelete({ id: postId }).exec();

//     return result;
//   }
// }
