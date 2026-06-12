import { db } from "@/infrastructure/db";

export async function findSubtopics() {
  return db.subtopic.findMany({
    orderBy: [
      { topic: { sortOrder: "asc" } },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });
}
