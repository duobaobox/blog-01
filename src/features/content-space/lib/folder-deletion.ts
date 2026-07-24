export function getFolderDeletionPublicPosts<
  T extends { status?: string | null },
>(posts: T[]) {
  return posts.filter((post) => post.status === "published");
}
