import { db } from "@/infrastructure/db";
import type { ContentLibraryFilters } from "@/features/content-space/lib/content-space-workspace";

export async function findSavedContentViewsByUser(userId: string) {
  return db.contentSpaceSavedView.findMany({
    where: {
      createdBy: userId,
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function countSavedContentViewsByUser(userId: string) {
  return db.contentSpaceSavedView.count({
    where: {
      createdBy: userId,
    },
  });
}

export async function findSavedContentViewById(id: string) {
  return db.contentSpaceSavedView.findUnique({
    where: { id },
  });
}

export async function findSavedContentViewByNameKey(input: {
  userId: string;
  nameKey: string;
}) {
  return db.contentSpaceSavedView.findUnique({
    where: {
      createdBy_nameKey: {
        createdBy: input.userId,
        nameKey: input.nameKey,
      },
    },
  });
}

export async function createSavedContentView(data: {
  userId: string;
  name: string;
  nameKey: string;
  filters: ContentLibraryFilters;
}) {
  return db.contentSpaceSavedView.create({
    data: {
      createdBy: data.userId,
      name: data.name,
      nameKey: data.nameKey,
      filters: data.filters,
    },
  });
}

export async function updateSavedContentView(
  id: string,
  data: {
    name: string;
    nameKey: string;
    filters: ContentLibraryFilters;
  },
) {
  return db.contentSpaceSavedView.update({
    where: { id },
    data: {
      name: data.name,
      nameKey: data.nameKey,
      filters: data.filters,
    },
  });
}

export async function deleteSavedContentView(id: string) {
  return db.contentSpaceSavedView.delete({
    where: { id },
  });
}
