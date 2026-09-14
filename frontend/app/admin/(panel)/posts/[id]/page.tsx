import { notFound } from 'next/navigation';

import { PostEditor } from '@/components/admin/PostEditor';

export const metadata = { title: 'Edit article' };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();
  return <PostEditor postId={postId} />;
}
