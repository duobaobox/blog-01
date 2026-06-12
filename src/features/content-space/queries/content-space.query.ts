import * as topicRepo from "@/features/content-space/repositories/topic.repository";
import * as subtopicRepo from "@/features/content-space/repositories/subtopic.repository";
import * as postRepo from "@/features/posts/repositories/post.repository";
import {
  buildContentTree,
  type ContentTreeInput,
} from "@/features/content-space/lib/content-space-tree";

export async function getContentTree() {
  const [topics, subtopics, posts] = await Promise.all([
    topicRepo.findTopics(),
    subtopicRepo.findSubtopics(),
    postRepo.findPosts({
      order: "updated",
      take: 200,
    }),
  ]);

  return buildContentTree({
    topics: topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      sortOrder: topic.sortOrder,
    })),
    subtopics: subtopics.map((subtopic) => ({
      id: subtopic.id,
      topicId: subtopic.topicId,
      name: subtopic.name,
      slug: subtopic.slug,
      sortOrder: subtopic.sortOrder,
    })),
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      status: post.status,
      updatedAt: post.updatedAt,
      subtopicId: post.subtopic?.id ?? null,
    })),
  } satisfies ContentTreeInput);
}

export async function getRecentEditedPosts(limit = 12) {
  return postRepo.findRecentlyUpdatedPosts(limit);
}

export async function getDraftPosts(limit = 20) {
  return postRepo.findDraftPosts(limit);
}

export async function getReadyToPublishPosts(limit = 20) {
  return postRepo.findReadyToPublishPosts(limit);
}
