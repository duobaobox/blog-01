import { parsePageParam } from "@/features/posts/lib/pagination";
import { getPublicPostsPageData } from "@/features/posts/queries/post.queries";

export type PublicPostsPageRequest = {
  page?: string | string[];
  categoryId?: string;
  tagId?: string;
};

export type ResolvedPublicPostsPage = Awaited<ReturnType<typeof getPublicPostsPageData>> & {
  currentPage: number;
  isValidPage: boolean;
  isOutOfRange: boolean;
};

type ResolvePublicPostsPageDeps = {
  getPublicPostsPageData: typeof getPublicPostsPageData;
};

export function createResolvePublicPostsPage(
  deps: ResolvePublicPostsPageDeps = {
    getPublicPostsPageData,
  },
) {
  return async function resolvePublicPostsPage(
    input: PublicPostsPageRequest,
  ): Promise<ResolvedPublicPostsPage> {
    const currentPage = parsePageParam(input.page);

    if (!currentPage) {
      return {
        posts: [],
        totalPosts: 0,
        totalPages: 1,
        currentPage: 1,
        isValidPage: false,
        isOutOfRange: false,
      };
    }

    const pageData = await deps.getPublicPostsPageData({
      page: currentPage,
      categoryId: input.categoryId,
      tagId: input.tagId,
    });

    return {
      ...pageData,
      currentPage,
      isValidPage: true,
      isOutOfRange: currentPage > pageData.totalPages,
    };
  };
}

export const resolvePublicPostsPage = createResolvePublicPostsPage();
