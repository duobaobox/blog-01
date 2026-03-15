"use client";

import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from "@/shared/ui/combobox";
import {
  getTagBadgeStyle,
  getTagDotStyle,
} from "@/features/taxonomy/lib/tag-color";

type TagOption = {
  id: string;
  name: string;
  color: string | null;
};

type TagMultiSelectProps = {
  tags: TagOption[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function TagMultiSelect({
  tags,
  value,
  onChange,
}: TagMultiSelectProps) {
  if (tags.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        暂无标签
      </div>
    );
  }

  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const selectedTags = value
    .map((tagId) => tagMap.get(tagId))
    .filter((tag): tag is TagOption => Boolean(tag));

  return (
    <Combobox
      multiple
      items={tags}
      value={selectedTags}
      onValueChange={(nextValue) =>
        onChange(
          Array.isArray(nextValue) ? nextValue.map((tag) => tag.id) : [],
        )
      }
      itemToStringLabel={(tag) => tag.name}
      itemToStringValue={(tag) => tag.id}
      isItemEqualToValue={(item, selected) => item.id === selected.id}
    >
      <ComboboxInputGroup className="pr-2">
        {selectedTags.length > 0 ? (
          <ComboboxChips>
            {selectedTags.map((tag) => (
              <ComboboxChip
                key={tag.id}
                className="border"
                style={getTagBadgeStyle(tag.color)}
              >
                <span
                  className="size-1.5 rounded-full bg-muted-foreground/35"
                  style={getTagDotStyle(tag.color)}
                />
                <span className="max-w-[9rem] truncate">{tag.name}</span>
                <ComboboxChipRemove
                  className="text-current/60 hover:bg-black/5 hover:text-current"
                  aria-label={`移除标签 ${tag.name}`}
                >
                  <X className="size-3" />
                </ComboboxChipRemove>
              </ComboboxChip>
            ))}
          </ComboboxChips>
        ) : null}

        <ComboboxInput
          placeholder={
            selectedTags.length > 0 ? "继续添加标签" : "搜索并选择标签"
          }
          className="min-w-[6rem] px-0"
        />
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
      </ComboboxInputGroup>

      <ComboboxContent>
        <ComboboxEmpty>没有匹配的标签</ComboboxEmpty>
        <ComboboxList>
          {tags.map((tag) => (
            <ComboboxItem key={tag.id} value={tag}>
              <span
                className={cn(
                  "size-2 rounded-full bg-muted-foreground/35",
                  tag.color && "bg-transparent",
                )}
                style={getTagDotStyle(tag.color)}
              />
              <span className="truncate">{tag.name}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
