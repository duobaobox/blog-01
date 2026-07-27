import { revalidatePublicContent } from "@/infrastructure/cache/public-cache";

export type PublicContentRevalidationPost = {
  slug?: string | null;
  category?: { slug?: string | null } | null;
  tags?: Array<{ tag?: { slug?: string | null } | null }> | null;
};

export function revalidatePostsContent(posts: PublicContentRevalidationPost[]) {
  revalidatePublicContent({
    postSlugs: posts.map((post) => post.slug),
    categorySlugs: posts.map((post) => post.category?.slug),
    tagSlugs: posts.flatMap(
      (post) => post.tags?.map((postTag) => postTag.tag?.slug) ?? [],
    ),
  });
}

export function revalidateCategoryContent(
  slugs: Array<string | null | undefined>,
) {
  revalidatePublicContent({ categorySlugs: slugs });
}

export function revalidateTagContent(slugs: Array<string | null | undefined>) {
  revalidatePublicContent({ tagSlugs: slugs });
}
