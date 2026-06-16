import type * as postRepo from "@/features/posts/repositories/post.repository";

export type MediaReference = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
  usage: Array<"cover" | "content">;
};

type MediaReferencePost = Awaited<
  ReturnType<typeof postRepo.findPostsReferencingMedia>
>[number];

export function buildMediaReferences(
  posts: MediaReferencePost[],
): MediaReference[] {
  return posts.map((post) => {
    const usage = [...new Set(
      post.mediaReferences.flatMap((reference) =>
        reference.usage === "cover" || reference.usage === "content"
          ? [reference.usage]
          : [],
      ),
    )] as MediaReference["usage"];

    return {
      id: post.id,
      title: post.title,
      status: post.status,
      updatedAt: post.updatedAt,
      folder: post.folder,
      usage,
    };
  });
}
