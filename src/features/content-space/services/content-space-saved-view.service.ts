import {
  buildSavedContentView,
  MAX_SAVED_CONTENT_VIEWS,
  normalizeSavedContentViewInput,
  parseSavedContentViewFilters,
  type SavedContentView,
} from "@/features/content-space/lib/content-space-saved-view-shared";
import type { ContentLibraryFilters } from "@/features/content-space/lib/content-space-workspace";
import * as savedViewRepo from "@/features/content-space/repositories/content-space-saved-view.repository";
import { ValidationError } from "@/shared/lib/app-error";
import { requireEntity } from "@/shared/lib/validation";

type SavedViewRepository = Pick<
  typeof savedViewRepo,
  | "findSavedContentViewsByUser"
  | "countSavedContentViewsByUser"
  | "findSavedContentViewById"
  | "findSavedContentViewByNameKey"
  | "createSavedContentView"
  | "updateSavedContentView"
  | "deleteSavedContentView"
>;

function mapSavedContentViewRecord(record: {
  id: string;
  name: string;
  filters: unknown;
  createdAt: Date;
}): SavedContentView {
  return buildSavedContentView({
    id: record.id,
    name: record.name,
    filters: parseSavedContentViewFilters(record.filters),
    createdAt: record.createdAt,
  });
}

export function createSavedContentViewService(
  repo: SavedViewRepository = savedViewRepo,
) {
  return {
    async getSavedContentViews(userId: string) {
      const views = await repo.findSavedContentViewsByUser(userId);
      return views.map(mapSavedContentViewRecord);
    },

    async saveSavedContentView(input: {
      userId: string;
      name: string;
      filters: ContentLibraryFilters;
    }) {
      const normalized = normalizeSavedContentViewInput({
        name: input.name,
        filters: input.filters,
      });

      const existingView = await repo.findSavedContentViewByNameKey({
        userId: input.userId,
        nameKey: normalized.nameKey,
      });

      if (existingView) {
        const updated = await repo.updateSavedContentView(existingView.id, {
          name: normalized.name,
          nameKey: normalized.nameKey,
          filters: normalized.filters,
        });

        return mapSavedContentViewRecord(updated);
      }

      const totalViews = await repo.countSavedContentViewsByUser(input.userId);
      if (totalViews >= MAX_SAVED_CONTENT_VIEWS) {
        throw new ValidationError(`最多只能保存 ${MAX_SAVED_CONTENT_VIEWS} 个视图`);
      }

      const created = await repo.createSavedContentView({
        userId: input.userId,
        name: normalized.name,
        nameKey: normalized.nameKey,
        filters: normalized.filters,
      });

      return mapSavedContentViewRecord(created);
    },

    async deleteSavedContentView(input: {
      userId: string;
      viewId: string;
    }) {
      const existingView = requireEntity(
        await repo.findSavedContentViewById(input.viewId),
        "保存视图不存在",
      );

      if (existingView.createdBy !== input.userId) {
        throw new ValidationError("不能删除其他人的保存视图");
      }

      await repo.deleteSavedContentView(existingView.id);
    },
  };
}

const savedContentViewService = createSavedContentViewService();

export const getSavedContentViews = savedContentViewService.getSavedContentViews;
export const saveSavedContentView = savedContentViewService.saveSavedContentView;
export const deleteSavedContentView = savedContentViewService.deleteSavedContentView;
