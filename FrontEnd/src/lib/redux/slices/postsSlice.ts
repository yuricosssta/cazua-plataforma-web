// FrontEnd/src/lib/redux/slices/postsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IPost } from '@/types/post';
import axiosInstance from '@/lib/api/axiosInstance'; // Usaremos a instância configurada

// interface PostsState {
//   posts: IPost[];
//   currentPost: IPost | null;
//   status: 'idle' | 'loading' | 'succeeded' | 'failed';
//   error: string | null | undefined;
// }

interface PaginatedPostsResult {
  data: IPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// const initialState: PostsState = {
//   posts: [],
//   currentPost: null,
//   status: 'idle',
//   error: null,
// };

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

// Thunks para operações assíncronas da API
// export const fetchPosts = createAsyncThunk<IPost[]>('posts/fetchPosts', async () => {
//   const response = await axiosInstance.get('/posts');
//   return response.data;
// });

export const fetchPosts = createAsyncThunk<PaginatedPostsResult, { page: number; limit?: number }>(
  'posts/fetchPosts',
  async ({ page, limit = 10 }) => {
    const response = await axiosInstance.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  }
);

export const fetchPostById = createAsyncThunk<IPost, string>('posts/fetchPostById', async (_id) => {
  const response = await axiosInstance.get(`/posts/${_id}`);
  return response.data;
});

export const createNewPost = createAsyncThunk<IPost, Omit<IPost, '_id'>>('posts/createNewPost', async (newPost) => {
  const response = await axiosInstance.post('/posts', newPost);
  return response.data;
});

export const updatePost = createAsyncThunk<IPost, IPost>('posts/updatePost', async (post) => {
  const response = await axiosInstance.put(`/posts/${post._id}`, post);
  return response.data;
});

export const deletePost = createAsyncThunk<string, string>('posts/deletePost', async (_id) => {
  await axiosInstance.delete(`/posts/${_id}`);
  return _id;
});

// export const transcribeAudioAPI = async (file: File): Promise<string> => {
//   const formData = new FormData();
//   formData.append('file', file);

//   const response = await axiosInstance.post('/transcription/upload', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });

//   return response.data;
// };

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Posts
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      // .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<IPost[]>) => {
      //   state.status = 'succeeded';
      //   state.posts = action.payload;
      // })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<PaginatedPostsResult>) => {
        state.status = 'succeeded';
        // Atualiza o estado com os dados da resposta paginada
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
      // Fetch Single Post
      .addCase(fetchPostById.fulfilled, (state, action: PayloadAction<IPost>) => {
        state.currentPost = action.payload;
      })
      // Create Post
      .addCase(createNewPost.fulfilled, (state, action: PayloadAction<IPost>) => {
        state.posts.push(action.payload);
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action: PayloadAction<IPost>) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<string>) => {
        state.posts = state.posts.filter(p => p._id !== action.payload);
      });
  },
});

export default postsSlice.reducer;