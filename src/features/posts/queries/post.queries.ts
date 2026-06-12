import * as postRepo from "@/features/posts/repositories/post.repository";

export async function getPosts(options?: postRepo.FindPostsOptions) {
  return postRepo.findPosts(options);
}

export async function getPostBySlug(slug: string) {
  return postRepo.findPostBySlug(slug);
}

export async function getPostById(id: string) {
  return postRepo.findPostById(id);
}

export async function getPostCount(filters?: string | postRepo.PostFilters) {
  return postRepo.countPosts(filters);
}

export async function getPublishedForFeed(take?: number) {
  return postRepo.findPublishedForFeed(take);
}

export async function getPublishedSlugs() {
  return postRepo.findPublishedSlugs();
}
