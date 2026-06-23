// src/lib/redux/slices/postsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IPost } from '@/types/post';
import { postService } from '@/lib/services/postService';

interface PaginatedPostsResult {
  data: IPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PostsState {
  posts: IPost[];
  currentPost: IPost | null;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  limit: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null | undefined;
}

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  currentPage: 1,
  totalPages: 1,
  totalPosts: 0,
  limit: 10,
  status: 'idle',
  error: null,
};

export const fetchPosts = createAsyncThunk<PaginatedPostsResult, { page: number; limit?: number }>(
  'posts/fetchPosts',
  async ({ page, limit = 10 }) => postService.getPosts(page, limit)
);

export const fetchPostById = createAsyncThunk<IPost, string>(
  'posts/fetchPostById', 
  async (id) => postService.getPostById(id)
);

export const createNewPost = createAsyncThunk<IPost, Omit<IPost, 'id'>>(
  'posts/createNewPost', 
  async (newPost) => postService.createPost(newPost)
);

export const updatePost = createAsyncThunk<IPost, { id: string; data: Partial<IPost> }>(
  'posts/updatePost', 
  async ({ id, data }) => postService.updatePost(id, data)
);

export const deletePost = createAsyncThunk<string, string>(
  'posts/deletePost', 
  async (id) => postService.deletePost(id).then(() => id)
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<PaginatedPostsResult>) => {
        state.status = 'succeeded';
        state.posts = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalPosts = action.payload.total;
        state.limit = action.payload.limit;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchPostById.fulfilled, (state, action: PayloadAction<IPost>) => {
        state.currentPost = action.payload;
      })
      .addCase(createNewPost.fulfilled, (state, action: PayloadAction<IPost>) => {
        state.posts.unshift(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action: PayloadAction<IPost>) => {
        const index = state.posts.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.posts[index] = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<string>) => {
        state.posts = state.posts.filter(p => p.id !== action.payload);
      });
  },
});

export default postsSlice.reducer;