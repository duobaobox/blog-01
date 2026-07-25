"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import readingTime from "reading-time";
import { HelpCircle, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  hasMeaningfulContent,
  parseStoredContentJson,
  stringifyContentJson,
} from "@/features/editor/content-types";
import {
  createPost,
  updatePost,
} from "@/features/posts/actions/post.actions";
import {
  getPostAutosaveDelay,
  POST_AUTOSAVE_MAX_WAIT_MS,
} from "@/features/posts/lib/post-autosave";
import {
  UNTITLED_POST_TITLE,
  getPostDisplayTitle,
} from "@/features/posts/lib/post-title";
import { getPostPublishability } from "@/features/posts/lib/post-publishability";
import {
  getPostStatusLabel,
  getPostStatusTone,
  isPublishedPost,
} from "@/features/posts/lib/post-status";
import { TagMultiSelect } from "@/features/taxonomy/components/tag-multi-select";
import { PostRichEditor } from "@/components/admin/post-rich-editor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useConfirm } from "@/shared/lib/use-confirm";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentJson: unknown;
  contentText: string;
  status: string;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string;
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  tags: { tag: Tag }[];
  folder: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface PostFormProps {
  post?: PostData;
  categories: Category[];
  tags: Tag[];
  folderOptions?: Array<{
    id: string;
    name: string;
  }>;
  defaultFolderId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  registerBeforeLeave?: (handler: (() => Promise<boolean>) | null) => void;
}

type FormState = {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  contentJson: string;
  contentText: string;
  categoryId: string;
  folderId: string;
  selectedTagIds: string[];
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  status: string;
};

type SaveIntent = "autosave" | "manual" | "navigation" | "publish";

type SaveOptions = {
  targetStatus?: string;
  updateUrlAfterCreate?: boolean;
  silent?: boolean;
  intent?: SaveIntent;
};

type AiSeoSuggestion = {
  titleCandidates: string[];
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  issues: string[];
};

const POST_STATUS_BADGE_CLASSES = {
  internal:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  published:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
} as const;

function createFormState(
  post?: PostData,
  options?: {
    defaultFolderId?: string;
  },
): FormState {
  return {
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    coverImageUrl: post?.coverImageUrl ?? "",
    contentJson: stringifyContentJson(post?.contentJson),
    contentText: post?.contentText ?? "",
    categoryId: post?.categoryId ?? "",
    folderId: post?.folder?.id ?? options?.defaultFolderId ?? "",
    selectedTagIds: post?.tags.map((item) => item.tag.id) ?? [],
    isFeatured: post?.isFeatured ?? false,
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    canonicalUrl: post?.canonicalUrl ?? "",
    status: isPublishedPost(post ?? {}) ? "published" : "draft",
  };
}

function createSnapshot(form: FormState) {
  return JSON.stringify({
    title: form.title,
    excerpt: form.excerpt,
    coverImageUrl: form.coverImageUrl,
    contentJson: form.contentJson,
    categoryId: form.categoryId,
    folderId: form.folderId,
    selectedTagIds: [...form.selectedTagIds].sort(),
    isFeatured: form.isFeatured,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    canonicalUrl: form.canonicalUrl,
    status: form.status,
  });
}

function hasMeaningfulDraft(form: FormState) {
  return Boolean(
    form.title.trim() ||
    form.excerpt.trim() ||
    form.coverImageUrl.trim() ||
    form.contentText.trim() ||
    hasMeaningfulContent(parseStoredContentJson(form.contentJson)) ||
    form.categoryId ||
    form.folderId ||
    form.selectedTagIds.length > 0 ||
    form.isFeatured ||
    form.seoTitle.trim() ||
    form.seoDescription.trim() ||
    form.canonicalUrl.trim(),
  );
}

function prepareFormForSave(
  form: FormState,
  targetStatus: string,
  existingSlug?: string | null,
) {
  const hasTitle = Boolean(form.title.trim());
  const title = hasTitle ? form.title : UNTITLED_POST_TITLE;
  const slug = existingSlug ?? null;

  return {
    form: {
      ...form,
      title,
      status: targetStatus,
    },
    slug,
  };
}

function buildPostFormData(
  form: FormState,
  slug: string | null,
  intent: SaveIntent,
) {
  const formData = new FormData();
  formData.set("title", form.title);
  if (slug) formData.set("slug", slug);
  formData.set("excerpt", form.excerpt);
  formData.set("coverImageUrl", form.coverImageUrl);
  formData.set("contentJson", form.contentJson);
  formData.set("categoryId", form.categoryId);
  formData.set("folderId", form.folderId);
  formData.set("status", form.status);
  formData.set("isFeatured", form.isFeatured.toString());
  formData.set("seoTitle", form.seoTitle);
  formData.set("seoDescription", form.seoDescription);
  formData.set("canonicalUrl", form.canonicalUrl);
  formData.set("saveIntent", intent);
  form.selectedTagIds.forEach((id) => formData.append("tagIds", id));
  return formData;
}

export function PostForm({
  post,
  categories,
  tags,
  folderOptions = [],
  defaultFolderId,
  onDirtyChange,
  registerBeforeLeave,
}: PostFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    createFormState(post, { defaultFolderId }),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [aiSeoLoading, setAiSeoLoading] = useState(false);
  const [aiSeoSuggestion, setAiSeoSuggestion] = useState<AiSeoSuggestion | null>(null);
  const [aiSeoError, setAiSeoError] = useState<string | null>(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const {
    open: leaveConfirmOpen,
    confirm: confirmLeave,
    handleCancel: handleLeaveCancel,
    handleConfirm: handleLeaveConfirm,
  } = useConfirm();
  const baselineRef = useRef(
    createSnapshot(createFormState(post, { defaultFolderId })),
  );
  const formRef = useRef(form);
  const postIdRef = useRef<string | null>(post?.id ?? null);
  const postSlugRef = useRef<string | null>(post?.slug ?? null);
  const persistedStatusRef = useRef(
    isPublishedPost(post ?? {}) ? "published" : "draft",
  );
  const changeVersionRef = useRef(0);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const autosaveMaxWaitDeadlineRef = useRef<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleBeforeEditRef = useRef("");
  const displayTitle = getPostDisplayTitle(form.title);
  const isDirty = useMemo(
    () => createSnapshot(form) !== baselineRef.current,
    [form],
  );

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (!titleEditing) return;

    const input = titleInputRef.current;
    if (!input) return;

    input.focus();
    const cursorPosition = input.value.length;
    input.setSelectionRange(cursorPosition, cursorPosition);
  }, [titleEditing]);

  const notifyDirtyChange = useEffectEvent((dirty: boolean) => {
    onDirtyChange?.(dirty);
  });

  useEffect(() => {
    notifyDirtyChange(isDirty);
  }, [isDirty]);

  useEffect(() => {
    return () => onDirtyChange?.(false);
  }, [onDirtyChange]);

  function beginTitleEdit() {
    titleBeforeEditRef.current = formRef.current.title;
    setTitleEditing(true);
  }

  function finishTitleEdit() {
    setTitleEditing(false);
  }

  function cancelTitleEdit() {
    patchForm({ title: titleBeforeEditRef.current });
    setTitleEditing(false);
  }

  function handleEditorChange({ json, text }: { json: string; text: string }) {
    patchForm({ contentJson: json, contentText: text });
  }

  const readingStats = readingTime(form.contentText);
  const wordCount = readingStats.words;
  const readingMinutes =
    wordCount > 0 ? Math.max(1, Math.ceil(readingStats.minutes)) : 0;
  const publishability = useMemo(
    () =>
      getPostPublishability({
        title: form.title,
        contentJson: parseStoredContentJson(form.contentJson),
      }),
    [form.contentJson, form.title],
  );
  function patchForm(next: Partial<FormState>) {
    setSaveError(null);
    setForm((current) => {
      const updated = { ...current, ...next };
      if (createSnapshot(updated) !== createSnapshot(current)) {
        changeVersionRef.current += 1;
        formRef.current = updated;
      }
      return updated;
    });
  }

  async function handleGenerateAiSeo() {
    if (!form.contentText.trim()) {
      setAiSeoError("请先写入一些正文内容，再生成 SEO 建议。");
      return;
    }

    setAiSeoLoading(true);
    setAiSeoError(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seo-metadata",
          title: form.title,
          contentText: form.contentText,
          excerpt: form.excerpt,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { result?: AiSeoSuggestion; error?: string }
        | null;

      if (!response.ok || !payload?.result) {
        throw new Error(payload?.error || "AI 建议生成失败");
      }

      setAiSeoSuggestion(payload.result);
    } catch (error) {
      setAiSeoError(
        error instanceof Error && error.message
          ? error.message
          : "AI 建议生成失败，请稍后重试。",
      );
    } finally {
      setAiSeoLoading(false);
    }
  }

  function applyAiSeoSuggestion() {
    if (!aiSeoSuggestion) return;

    patchForm({
      title:
        form.title.trim() ||
        aiSeoSuggestion.titleCandidates[0] ||
        form.title,
      excerpt: form.excerpt.trim() ? form.excerpt : aiSeoSuggestion.excerpt,
      seoTitle: form.seoTitle.trim()
        ? form.seoTitle
        : aiSeoSuggestion.seoTitle,
      seoDescription: form.seoDescription.trim()
        ? form.seoDescription
        : aiSeoSuggestion.seoDescription,
    });
  }

  const savePost = useCallback(
    async ({
      targetStatus,
      updateUrlAfterCreate = true,
      silent = false,
      intent = "manual",
    }: SaveOptions = {}) => {
      if (savePromiseRef.current) {
        await savePromiseRef.current;
      }

      const currentForm = formRef.current;
      const currentPostId = postIdRef.current;
      const nextStatus = targetStatus ?? currentForm.status;
      const currentSnapshot = createSnapshot(currentForm);
      const hasPendingChanges = currentSnapshot !== baselineRef.current;
      const hasDraftContent = hasMeaningfulDraft(currentForm);

      if (!currentPostId && !hasDraftContent) {
        return true;
      }

      if (
        currentPostId &&
        !hasPendingChanges &&
        nextStatus === currentForm.status
      ) {
        return true;
      }

      const startedAsNewDraft = !currentPostId;
      const changeVersionAtSaveStart = changeVersionRef.current;
      const { form: persistedForm, slug } = prepareFormForSave(
        currentForm,
        nextStatus,
        postSlugRef.current,
      );

      const promise = (async () => {
        setSaving(true);
        setSaveError(null);

        try {
          const formData = buildPostFormData(persistedForm, slug, intent);
          const savedPost = currentPostId
            ? await updatePost(currentPostId, formData)
            : await createPost(formData);

          postIdRef.current = savedPost.id;
          postSlugRef.current = savedPost.slug;
          persistedStatusRef.current = savedPost.status;

          const acknowledgedForm = {
            ...persistedForm,
            title: savedPost.title ?? persistedForm.title,
            status: savedPost.status,
          };
          const savedSnapshot = createSnapshot(acknowledgedForm);

          baselineRef.current = savedSnapshot;
          autosaveMaxWaitDeadlineRef.current = null;

          if (changeVersionRef.current === changeVersionAtSaveStart) {
            formRef.current = acknowledgedForm;
            setForm(acknowledgedForm);
          } else {
            let patchedForm = formRef.current;

            if (patchedForm.status === currentForm.status) {
              patchedForm = { ...patchedForm, status: savedPost.status };
            }

            if (
              !currentForm.title.trim() &&
              patchedForm.title === currentForm.title
            ) {
              patchedForm = {
                ...patchedForm,
                title: savedPost.title ?? acknowledgedForm.title,
              };
            }

            if (patchedForm !== formRef.current) {
              formRef.current = patchedForm;
              setForm(patchedForm);
            }
          }

          if (startedAsNewDraft && updateUrlAfterCreate) {
            const nextFolderId =
              acknowledgedForm.folderId || currentForm.folderId;
            const nextUrl = new URL(window.location.href);

            if (nextFolderId) {
              nextUrl.searchParams.set("folder", nextFolderId);
            } else {
              nextUrl.searchParams.delete("folder");
            }
            nextUrl.searchParams.set("postId", savedPost.id);
            nextUrl.searchParams.delete("view");

            window.history.replaceState(
              null,
              "",
              `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
            );
          }

          return true;
        } catch (error) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "保存失败";
          setSaveError(message);
          if (intent === "autosave") {
            autosaveMaxWaitDeadlineRef.current =
              Date.now() + POST_AUTOSAVE_MAX_WAIT_MS;
          }
          if (!silent) {
            window.alert(message);
          }
          return false;
        } finally {
          setSaving(false);
        }
      })();

      savePromiseRef.current = promise;

      try {
        return await promise;
      } finally {
        if (savePromiseRef.current === promise) {
          savePromiseRef.current = null;
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!isDirty || saving || !hasMeaningfulDraft(form)) {
      if (!isDirty) {
        autosaveMaxWaitDeadlineRef.current = null;
      }
      return;
    }

    const now = Date.now();
    if (autosaveMaxWaitDeadlineRef.current === null) {
      autosaveMaxWaitDeadlineRef.current = now + POST_AUTOSAVE_MAX_WAIT_MS;
    }

    const delay = getPostAutosaveDelay({
      now,
      maxWaitDeadline: autosaveMaxWaitDeadlineRef.current,
    });
    const timer = window.setTimeout(() => {
      void savePost({
        updateUrlAfterCreate: true,
        silent: true,
        intent: "autosave",
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [form, isDirty, savePost, saving]);

  useEffect(() => {
    if (!registerBeforeLeave) return;

    registerBeforeLeave(async () => {
      if (!isDirty) return true;

      const saved = await savePost({
        updateUrlAfterCreate: false,
        silent: true,
        intent: "navigation",
      });

      if (saved) return true;

      return confirmLeave();
    });

    return () => registerBeforeLeave(null);
  }, [confirmLeave, isDirty, registerBeforeLeave, savePost]);

  async function handleSubmit(targetStatus = form.status) {
    await savePost({
      targetStatus,
      updateUrlAfterCreate: true,
      silent: false,
      intent:
        targetStatus === persistedStatusRef.current ? "manual" : "publish",
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge
            variant="outline"
            className={`rounded-full border px-2 py-0 text-xs ${POST_STATUS_BADGE_CLASSES[getPostStatusTone(form)]}`}
            title={`当前状态：${getPostStatusLabel(form)}`}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {getPostStatusLabel(form)}
          </Badge>
          <div className="min-w-0 max-w-[240px] flex-1 lg:max-w-[360px]">
            {titleEditing ? (
              <Input
                ref={titleInputRef}
                value={form.title}
                onChange={(event) =>
                  patchForm({ title: event.target.value })
                }
                onBlur={finishTitleEdit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelTitleEdit();
                  }
                }}
                placeholder="文章标题"
                aria-label="文章标题"
                className="h-7 w-full rounded-md border-transparent bg-muted/60 px-2 text-sm font-medium shadow-none placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2"
                suppressHydrationWarning
              />
            ) : (
              <button
                type="button"
                onClick={beginTitleEdit}
                className="block w-full truncate rounded-md px-2 py-1 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                title={`${displayTitle}（点击编辑）`}
              >
                {displayTitle}
              </button>
            )}
          </div>
          {form.isFeatured ? (
            <Badge variant="outline" className="rounded-full px-2 py-0 text-xs">
              置顶
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {wordCount > 0 ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {wordCount} 字 · {readingMinutes} 分钟
            </span>
          ) : null}
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {saveError
              ? saveError
              : saving
                ? "保存中..."
                : isDirty
                  ? "等待自动保存"
                  : "已保存"}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <SlidersHorizontal className="size-4" />
            设置
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-24"
            disabled={saving || !hasMeaningfulDraft(form)}
            onClick={() => handleSubmit(form.status)}
          >
            {saving ? "保存中..." : "保存"}
          </Button>

          <Button
            variant={isPublishedPost(form) ? "outline" : "default"}
            size="sm"
            className="w-24"
            disabled={
              saving ||
              (!isPublishedPost(form) && !publishability.canPublish)
            }
            onClick={() =>
              handleSubmit(isPublishedPost(form) ? "draft" : "published")
            }
            title={
              isPublishedPost(form) || publishability.canPublish
                ? undefined
                : publishability.reasons[0]
            }
          >
            {saving
              ? "处理中..."
              : isPublishedPost(form)
                ? "取消发布"
                : "发布"}
          </Button>
        </div>
      </div>

      <PostRichEditor
        initialJson={form.contentJson}
        contentKey={post?.id ?? "new-post"}
        placeholder="从一句清晰的开头开始。"
        onChange={handleEditorChange}
      />

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>文章设置</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" suppressHydrationWarning>
            <TabsList className="w-full" suppressHydrationWarning>
              <TabsTrigger value="basic" suppressHydrationWarning>
                基础
              </TabsTrigger>
              <TabsTrigger value="seo" suppressHydrationWarning>
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="basic"
              className="mt-5 flex flex-col gap-4"
              suppressHydrationWarning
            >
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">发布状态</span>
                  <span className="text-xs text-muted-foreground">
                    内部仅后台可见，已发布会出现在 Blog
                  </span>
                </div>
                <Select
                  value={form.status}
                  onValueChange={(value) => {
                    const nextStatus =
                      value === "published" ? "published" : "draft";
                    patchForm({ status: nextStatus });
                    void handleSubmit(nextStatus);
                  }}
                >
                  <SelectTrigger
                    id="status"
                    className="h-9 w-[140px] rounded-lg"
                    suppressHydrationWarning
                  >
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      <SelectItem value="draft">内部</SelectItem>
                      <SelectItem
                        value="published"
                        disabled={!publishability.canPublish}
                      >
                        已发布
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {!publishability.canPublish ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  发布前还需要处理：{publishability.reasons.join("；")}
                </p>
              ) : isPublishedPost(form) ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  这篇文章已对外可见，后续保存会继续保留发布时间。
                </p>
              ) : (
                <p className="rounded-lg border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  内部内容只在后台可见，准备好后可以直接发布。
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={form.categoryId || "__none__"}
                  onValueChange={(value) =>
                    patchForm({
                      categoryId: !value || value === "__none__" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger
                    id="category"
                    className="h-9 rounded-lg"
                    suppressHydrationWarning
                  >
                    <SelectValue placeholder="选择分类">
                      {(value) => {
                        if (!value || value === "__none__") {
                          return "无分类";
                        }

                        return (
                          categories.find((category) => category.id === value)
                            ?.name ?? "选择分类"
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="__none__">无分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="folder">归属文件夹</Label>
                <Select
                  value={form.folderId}
                  onValueChange={(value) => patchForm({ folderId: value })}
                >
                  <SelectTrigger
                    id="folder"
                    className="h-9 rounded-lg"
                    suppressHydrationWarning
                  >
                    <SelectValue placeholder="选择文件夹">
                      {(value) =>
                        folderOptions.find((folder) => folder.id === value)
                          ?.name ?? "选择文件夹"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      {folderOptions.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>标签</Label>
                <TagMultiSelect
                  tags={tags}
                  value={form.selectedTagIds}
                  onChange={(selectedTagIds) => patchForm({ selectedTagIds })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="excerpt">摘要</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(event) =>
                    patchForm({ excerpt: event.target.value })
                  }
                  rows={3}
                  placeholder="给文章补一句简介，列表页会优先展示这段话。"
                  className="rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="coverImageUrl">封面图</Label>
                <div className="flex gap-2">
                  <Input
                    id="coverImageUrl"
                    value={form.coverImageUrl}
                    onChange={(event) =>
                      patchForm({ coverImageUrl: event.target.value })
                    }
                    placeholder="https://..."
                    className="h-9 flex-1 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => setCoverPickerOpen(true)}
                  >
                    选择
                  </Button>
                </div>
                {form.coverImageUrl && (
                  <div className="relative mt-1 h-32 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={form.coverImageUrl}
                      alt="封面预览"
                      fill
                      sizes="(min-width: 1024px) 24rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">置顶展示</span>
                  <span className="text-xs text-muted-foreground">
                    首页和列表里更容易被看到
                  </span>
                </div>
                <Switch
                  id="featured"
                  checked={form.isFeatured}
                  onCheckedChange={(checked) =>
                    patchForm({ isFeatured: checked })
                  }
                  suppressHydrationWarning
                />
              </div>
            </TabsContent>

            <TabsContent
              value="seo"
              className="mt-5 flex flex-col gap-4"
              suppressHydrationWarning
            >
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Sparkles className="size-4 text-primary" />
                      AI SEO 助手
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      使用服务端 BYOK 配置生成标题、摘要和 SEO 元数据。结果只作为建议，不会自动发布；已有字段不会被覆盖。
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={aiSeoLoading || !form.contentText.trim()}
                    onClick={() => void handleGenerateAiSeo()}
                  >
                    <Sparkles className="size-3.5" />
                    {aiSeoLoading ? "生成中..." : "生成建议"}
                  </Button>
                </div>

                {aiSeoError ? (
                  <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
                    {aiSeoError}
                  </p>
                ) : null}

                {aiSeoSuggestion ? (
                  <div className="mt-3 space-y-2 rounded-md border bg-background p-3 text-xs">
                    <p className="font-medium">建议预览</p>
                    {aiSeoSuggestion.titleCandidates.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground">标题候选：</span>
                        <div className="flex flex-col gap-1.5">
                          {aiSeoSuggestion.titleCandidates.map((candidate) => (
                            <div
                              key={candidate}
                              className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2"
                            >
                              <span className="min-w-0 flex-1">{candidate}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => patchForm({ title: candidate })}
                              >
                                用此标题
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <p>
                      <span className="text-muted-foreground">摘要：</span>
                      {aiSeoSuggestion.excerpt || "未生成"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">SEO 标题：</span>
                      {aiSeoSuggestion.seoTitle || "未生成"}
                      {aiSeoSuggestion.seoTitle ? (
                        <span className="ml-1 text-muted-foreground">
                          （{aiSeoSuggestion.seoTitle.length} 字）
                        </span>
                      ) : null}
                    </p>
                    <p>
                      <span className="text-muted-foreground">SEO 描述：</span>
                      {aiSeoSuggestion.seoDescription || "未生成"}
                      {aiSeoSuggestion.seoDescription ? (
                        <span className="ml-1 text-muted-foreground">
                          （{aiSeoSuggestion.seoDescription.length} 字）
                        </span>
                      ) : null}
                    </p>
                    {aiSeoSuggestion.issues.length > 0 ? (
                      <p>
                        <span className="text-muted-foreground">检查提示：</span>
                        {aiSeoSuggestion.issues.join("；")}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      className="mt-1"
                      onClick={applyAiSeoSuggestion}
                    >
                      应用空白字段
                    </Button>
                  </div>
                ) : null}
              </div>

              <TooltipProvider>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="seoTitle">SEO 标题</Label>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <HelpCircle className="size-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                        }
                      />
                      <TooltipContent>
                        搜索引擎结果中显示的标题，建议包含核心关键词。
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="seoTitle"
                    value={form.seoTitle}
                    onChange={(event) =>
                      patchForm({ seoTitle: event.target.value })
                    }
                    placeholder="搜索结果里展示的标题"
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="seoDescription">SEO 描述</Label>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <HelpCircle className="size-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                        }
                      />
                      <TooltipContent>
                        搜索结果页显示的摘要，建议控制在 160 字以内。
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    id="seoDescription"
                    value={form.seoDescription}
                    onChange={(event) =>
                      patchForm({ seoDescription: event.target.value })
                    }
                    rows={3}
                    placeholder="概括文章内容，控制在 120–160 字更合适。"
                    className="rounded-lg text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="canonicalUrl">Canonical URL</Label>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <HelpCircle className="size-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                        }
                      />
                      <TooltipContent>
                        规范链接。告诉搜索引擎此文章的官方原始地址，防止权重分散。
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="canonicalUrl"
                    value={form.canonicalUrl}
                    onChange={(event) =>
                      patchForm({ canonicalUrl: event.target.value })
                    }
                    placeholder="https://example.com/blog/post"
                    className="h-9 rounded-lg"
                  />
                </div>
              </TooltipProvider>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        onSelect={(media) => patchForm({ coverImageUrl: media.url })}
        mimeTypePrefix="image"
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        onOpenChange={(open) => !open && handleLeaveCancel()}
        title="放弃未保存内容"
        description="当前有未保存内容，确认丢弃并切换文章吗？"
        confirmText="丢弃"
        variant="destructive"
        onConfirm={handleLeaveConfirm}
      />
    </div>
  );
}
