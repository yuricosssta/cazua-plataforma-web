// "use client";

import { PostList } from '@/components/PostList';
import { store } from "@/lib/redux/store";
import { fetchPosts } from "@/lib/redux/slices/postsSlice";

// export default function PostsPage() {
export default async function PostsPage() {
  await store.dispatch(fetchPosts({ page: 1 })); // Fetch posts for the first page

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      <PostList />
    </div>
  );
}