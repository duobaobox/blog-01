import { db } from "@/infrastructure/db";

export async function findTopics() {
  return db.topic.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
