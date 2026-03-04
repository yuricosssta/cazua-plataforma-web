// "use client";

import { PostList } from '@/components/PostList';
import { store } from "@/lib/redux/store";
import { fetchPosts } from "@/lib/redux/slices/postsSlice";

// export default function PostsPage() {
export default async function PostsPage() {
  await store.dispatch(fetchPosts({ page: 1 })); // Fetch posts for the first page

  return (

    // <div className="container mx-auto px-5 mb-10">
    <div>
      <PostList />
    </div>
  );
}