import type { PostBulkActionInput } from "@/features/posts/lib/post-bulk-action";
import { shouldRevalidateAdminAfterSave } from "@/features/posts/lib/post-save-plan";
import type { PostStatus, PostWriteInput } from "@/features/posts/lib/post-write";
import type * as postServiceModule from "@/features/posts/services/post.service";
import {
  buildBulkUpdatePostsWorkflow,
  buildCreateEmptyPostWorkflow,
  buildCreatePostWorkflow,
  buildDeletePostWorkflow,
  buildUpdatePostWorkflow,
} from "@/features/posts/lib/post-action-workflow";

type PostService = Pick<
  typeof postServiceModule,
  "createPost" | "createEmptyPost" | "updatePost" | "deletePost" | "applyBulkAction"
>;

type PostActionRunnerDeps = {
  postService: PostService;
  revalidateAdminPosts(): void;
  revalidateAdminPostTags?(): void;
  revalidatePostsContent(
    posts: Array<{
      slug?: string | null;
      category?: { slug?: string | null } | null;
      tags?: Array<{ tag?: { slug?: string | null } | null }> | null;
    }>,
  ): void;
};

function revalidateAdminAfterSave(
  deps: PostActionRunnerDeps,
  saveIntent: PostWriteInput["saveIntent"],
) {
  if (!shouldRevalidateAdminAfterSave(saveIntent)) {
    return;
  }

  deps.revalidateAdminPosts();
}

export function createPostActionRunner(deps: PostActionRunnerDeps) {
  return {
    async createPost(input: PostWriteInput & { createdBy: string }) {
      const post = await deps.postService.createPost(input);
      const workflow = buildCreatePostWorkflow(post);

      if (workflow.revalidateAdminPosts) {
        revalidateAdminAfterSave(deps, input.saveIntent);
      }
      if (
        workflow.publicPostsToRevalidate.length > 0 &&
        input.saveIntent !== "autosave"
      ) {
        deps.revalidatePostsContent(workflow.publicPostsToRevalidate);
      }

      return post;
    },

    async createEmptyPost(input: {
      createdBy: string;
      folderId?: string | null;
      status?: PostStatus;
    }) {
      const post = await deps.postService.createEmptyPost(input);
      const workflow = buildCreateEmptyPostWorkflow();

      if (workflow.revalidateAdminPosts) {
        deps.revalidateAdminPosts();
      }

      return post;
    },

    async updatePost(
      id: string,
      input: PostWriteInput & {
        updatedBy: string;
      },
    ) {
      const result = await deps.postService.updatePost(id, input);
      const workflow = buildUpdatePostWorkflow({
        previousPost: result.previousPost,
        nextPost: result.post,
      });

      if (workflow.revalidateAdminPosts) {
        revalidateAdminAfterSave(deps, input.saveIntent);
      }
      if (
        workflow.publicPostsToRevalidate.length > 0 &&
        input.saveIntent !== "autosave"
      ) {
        deps.revalidatePostsContent(workflow.publicPostsToRevalidate);
      }

      return result.post;
    },

    async deletePost(input: {
      id: string;
      deletedBy: string;
    }) {
      const result = await deps.postService.deletePost(input);
      const workflow = buildDeletePostWorkflow({
        previousStatus: result.previousStatus,
        deletedPost: result.post,
      });

      if (workflow.revalidateAdminPosts) {
        deps.revalidateAdminPosts();
      }
      if (workflow.publicPostsToRevalidate.length > 0) {
        deps.revalidatePostsContent(workflow.publicPostsToRevalidate);
      }
    },

    async applyBulkAction(input: PostBulkActionInput & {
      updatedBy: string;
    }) {
      const result = await deps.postService.applyBulkAction(input);
      const workflow = buildBulkUpdatePostsWorkflow({
        previousPosts: result.previousPosts,
        updatedPosts: result.updatedPosts,
      });

      if (workflow.revalidateAdminPosts) {
        deps.revalidateAdminPosts();
      }
      if (workflow.publicPostsToRevalidate.length > 0) {
        deps.revalidatePostsContent(workflow.publicPostsToRevalidate);
      }

      return result.updatedPosts;
    },
  };
}
