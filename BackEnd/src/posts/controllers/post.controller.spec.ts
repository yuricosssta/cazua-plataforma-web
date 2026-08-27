import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from '../services/post.service';
import { IUser } from '../../users/schemas/models/user.interface';

describe('PostController', () => {
  let postController: PostController;
  let postService: PostService;

  const mockPostService = {
    getAllPosts: jest.fn(),
    searchPost: jest.fn(),
    getPost: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: mockPostService,
        },
      ],
    }).compile();

    postController = module.get<PostController>(PostController);
    postService = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(postController).toBeDefined();
  });

  describe('getAllPosts', () => {
    it('should return all posts', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1', description: 'Desc 1' }];
      mockPostService.getAllPosts.mockResolvedValue(mockPosts);

      const result = await postController.getAllPosts();
      expect(result).toEqual(mockPosts);
      expect(postService.getAllPosts).toHaveBeenCalled();
    });
  });

  describe('searchPost', () => {
    it('should return search results', async () => {
      const mockSearchResults = [
        { id: '1', title: 'Test', description: 'Desc' },
      ];
      const searchTerm = 'Test';
      mockPostService.searchPost.mockResolvedValue(mockSearchResults);

      const result = await postController.searchPost(searchTerm);
      expect(result).toEqual(mockSearchResults);
      expect(postService.searchPost).toHaveBeenCalledWith(searchTerm);
    });
  });

  describe('getPost', () => {
    it('should return a single post', async () => {
      const mockPost = { id: '1', title: 'Post 1', description: 'Desc 1' };
      const postId = '1';
      mockPostService.getPost.mockResolvedValue(mockPost);

      const result = await postController.getPost(postId);
      expect(result).toEqual(mockPost);
      expect(postService.getPost).toHaveBeenCalledWith(postId);
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const newPost = { title: 'New Post', description: 'New Desc' };
      const createdPost = { id: '1', ...newPost };
      mockPostService.createPost.mockResolvedValue(createdPost);

      const mockUser: IUser = {
        id: '123',
        email: 'silva@silva.com',
        name: 'silva',
        password: 'password',
        isAdmin: false,
        rule: 2,
      };

      const result = await postController.createPost(newPost, mockUser);
      expect(result).toEqual(createdPost);
      expect(postService.createPost).toHaveBeenCalledWith(newPost, mockUser);
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const updatedPost = {
        title: 'Updated Post',
        description: 'Updated Desc',
      };
      const postId = '1';
      const updatedResult = { id: postId, ...updatedPost };
      mockPostService.updatePost.mockResolvedValue(updatedResult);

      const result = await postController.updatePost(postId, updatedPost);
      expect(result).toEqual(updatedResult);
      expect(postService.updatePost).toHaveBeenCalledWith(postId, updatedPost);
    });
  });

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const postId = '1';
      mockPostService.deletePost.mockResolvedValue({ success: true });

      const result = await postController.deletePost(postId);
      expect(result).toEqual({ success: true });
      expect(postService.deletePost).toHaveBeenCalledWith(postId);
    });
  });
});
