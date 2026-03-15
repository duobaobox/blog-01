"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import readingTime from "reading-time";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import {
  deletePost,
  createPost,
  updatePost,
} from "@/features/posts/actions/post.actions";
import {
  UNTITLED_POST_TITLE,
  getPostDisplayTitle,
} from "@/features/posts/lib/post-title";
import { TagMultiSelect } from "@/features/taxonomy/components/tag-multi-select";
import type { Editor } from "@tiptap/core";
import {
  EditorToolbar,
  PostRichEditor,
} from "@/components/admin/post-rich-editor";
import { generateShortSlug } from "@/shared/lib/slug";
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
  contentJson?: unknown | null;
  contentMarkdown: string;
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
}

interface PostFormProps {
  post?: PostData;
  categories: Category[];
  tags: Tag[];
  onDirtyChange?: (dirty: boolean) => void;
  registerBeforeLeave?: (handler: (() => Promise<boolean>) | null) => void;
}

type FormState = {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  contentJson: string;
  contentMarkdown: string;
  categoryId: string;
  selectedTagIds: string[];
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  status: string;
};

type SaveOptions = {
  targetStatus?: string;
  redirectAfterCreate?: boolean;
  refreshAfterCreate?: boolean;
  silent?: boolean;
};

function generateSlug() {
  return generateShortSlug("p");
}

function serializeContentJson(value: unknown | null | undefined) {
  if (!value) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function createFormState(post?: PostData): FormState {
  return {
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    coverImageUrl: post?.coverImageUrl ?? "",
    contentJson: serializeContentJson(post?.contentJson),
    contentMarkdown: post?.contentMarkdown ?? "",
    categoryId: post?.categoryId ?? "",
    selectedTagIds: post?.tags.map((item) => item.tag.id) ?? [],
    isFeatured: post?.isFeatured ?? false,
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    canonicalUrl: post?.canonicalUrl ?? "",
    status: post?.status ?? "draft",
  };
}

function createSnapshot(form: FormState) {
  return JSON.stringify({
    title: form.title,
    excerpt: form.excerpt,
    coverImageUrl: form.coverImageUrl,
    contentMarkdown: form.contentMarkdown,
    categoryId: form.categoryId,
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
    form.contentMarkdown.trim() ||
    form.categoryId ||
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
  const slug = existingSlug || generateSlug();

  return {
    form: {
      ...form,
      title,
      status: targetStatus,
    },
    slug,
  };
}

function buildPostFormData(form: FormState, slug: string) {
  const formData = new FormData();
  formData.set("title", form.title);
  formData.set("slug", slug);
  formData.set("excerpt", form.excerpt);
  formData.set("coverImageUrl", form.coverImageUrl);
  formData.set("contentJson", form.contentJson);
  formData.set("contentMarkdown", form.contentMarkdown);
  formData.set("categoryId", form.categoryId);
  formData.set("status", form.status);
  formData.set("isFeatured", form.isFeatured.toString());
  formData.set("seoTitle", form.seoTitle);
  formData.set("seoDescription", form.seoDescription);
  formData.set("canonicalUrl", form.canonicalUrl);
  form.selectedTagIds.forEach((id) => formData.append("tagIds", id));
  return formData;
}

export function PostForm({
  post,
  categories,
  tags,
  onDirtyChange,
  registerBeforeLeave,
}: PostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createFormState(post));
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const deleteConfirm = useConfirm();
  const leaveConfirm = useConfirm();
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const baselineRef = useRef(createSnapshot(createFormState(post)));
  const formRef = useRef(form);
  const postIdRef = useRef<string | null>(post?.id ?? null);
  const postSlugRef = useRef<string | null>(post?.slug ?? null);
  const changeVersionRef = useRef(0);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const displayTitle = getPostDisplayTitle(form.title);

  useEffect(() => {
    const nextForm = createFormState(post);
    postIdRef.current = post?.id ?? null;
    postSlugRef.current = post?.slug ?? null;
    baselineRef.current = createSnapshot(nextForm);
    formRef.current = nextForm;
    changeVersionRef.current = 0;
    setForm(nextForm);
    setIsDirty(false);
    setSaveError(null);
  }, [post]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const nextDirty = createSnapshot(form) !== baselineRef.current;
    setIsDirty(nextDirty);
  }, [form]);

  const notifyDirtyChange = useEffectEvent((dirty: boolean) => {
    onDirtyChange?.(dirty);
  });

  useEffect(() => {
    notifyDirtyChange(isDirty);
  }, [isDirty]);

  useEffect(() => {
    return () => onDirtyChange?.(false);
  }, [onDirtyChange]);

  function handleEditorChange({
    json,
    markdown,
  }: {
    json: string;
    markdown: string;
    text: string;
  }) {
    patchForm({ contentJson: json, contentMarkdown: markdown });
  }

  const readingStats = readingTime(form.contentMarkdown);
  const wordCount = readingStats.words;
  const readingMinutes =
    wordCount > 0 ? Math.max(1, Math.ceil(readingStats.minutes)) : 0;

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

  const savePost = useCallback(
    async ({
      targetStatus,
      redirectAfterCreate = true,
      refreshAfterCreate = true,
      silent = false,
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
          const savedPost = currentPostId
            ? await updatePost(
                currentPostId,
                buildPostFormData(persistedForm, slug),
              )
            : await createPost(buildPostFormData(persistedForm, slug));

          postIdRef.current = savedPost.id;
          postSlugRef.current = savedPost.slug;

          const savedForm = {
            ...persistedForm,
            status: savedPost.status,
          };
          const savedSnapshot = createSnapshot(savedForm);

          baselineRef.current = savedSnapshot;

          if (changeVersionRef.current === changeVersionAtSaveStart) {
            formRef.current = savedForm;
            setForm(savedForm);
            setIsDirty(false);
          } else {
            let patchedForm = formRef.current;

            if (patchedForm.status === currentForm.status) {
              patchedForm = { ...patchedForm, status: savedPost.status };
            }

            if (
              !currentForm.title.trim() &&
              patchedForm.title === currentForm.title
            ) {
              patchedForm = { ...patchedForm, title: savedForm.title };
            }

            if (patchedForm !== formRef.current) {
              formRef.current = patchedForm;
              setForm(patchedForm);
            }

            setIsDirty(createSnapshot(patchedForm) !== savedSnapshot);
          }

          if (startedAsNewDraft && redirectAfterCreate) {
            startTransition(() => {
              router.replace(`/admin/posts?postId=${savedPost.id}`);
              if (refreshAfterCreate) {
                router.refresh();
              }
            });
          }

          return true;
        } catch {
          setSaveError("保存失败");
          if (!silent) {
            window.alert("保存失败，请稍后重试。");
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
    [router],
  );

  useEffect(() => {
    if (!isDirty || saving || !hasMeaningfulDraft(form)) return;
    const timer = setTimeout(() => {
      void savePost({
        redirectAfterCreate: true,
        refreshAfterCreate: true,
        silent: true,
      });
    }, 1800);
    return () => clearTimeout(timer);
  }, [form, isDirty, savePost, saving]);

  useEffect(() => {
    if (!registerBeforeLeave) return;

    registerBeforeLeave(async () => {
      if (!isDirty) return true;

      const saved = await savePost({
        redirectAfterCreate: false,
        refreshAfterCreate: false,
        silent: true,
      });

      if (saved) return true;

      return leaveConfirm.confirm();
    });

    return () => registerBeforeLeave(null);
  }, [isDirty, registerBeforeLeave, savePost, leaveConfirm.confirm]);

  async function handleSubmit(targetStatus = form.status) {
    await savePost({
      targetStatus,
      redirectAfterCreate: true,
      refreshAfterCreate: true,
      silent: false,
    });
  }

  async function handleDelete() {
    if (!post || !(await deleteConfirm.confirm())) return;

    try {
      await deletePost(post.id);
      startTransition(() => {
        router.push("/admin/posts");
        router.refresh();
      });
    } catch {
      window.alert("删除失败，请稍后重试。");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top action bar */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="max-w-[240px] truncate text-sm font-medium text-foreground lg:max-w-[360px]"
            title={displayTitle}
          >
            {displayTitle}
          </span>
          <Badge
            variant={form.status === "published" ? "default" : "secondary"}
            className="rounded-full px-2 py-0 text-xs"
          >
            {form.status === "published" ? "已发布" : "草稿"}
          </Badge>
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
                  ? "未保存"
                  : "已保存"}
          </span>

          {post ? (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={saving}
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}

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
            disabled={saving || !hasMeaningfulDraft(form)}
            onClick={() => handleSubmit(form.status)}
          >
            {saving ? "保存中..." : "保存草稿"}
          </Button>

          <Button
            size="sm"
            disabled={saving || !form.title.trim()}
            onClick={() => handleSubmit("published")}
          >
            {saving
              ? "处理中..."
              : post && form.status === "published"
                ? "更新发布"
                : "发布文章"}
          </Button>
        </div>
      </div>

      {/* Editor toolbar */}
      <EditorToolbar editor={editorInstance} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          <Input
            value={form.title}
            onChange={(event) => patchForm({ title: event.target.value })}
            placeholder="文章标题"
            className="h-auto border-0 bg-transparent px-0 py-0 text-4xl font-bold tracking-tight shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0 md:text-5xl"
            suppressHydrationWarning
          />

          <PostRichEditor
            initialJson={form.contentJson}
            initialMarkdown={form.contentMarkdown}
            placeholder={`从一句清晰的开头开始。\n\n# 可以像这样写标题\n- 或者先列出要点\n- 再慢慢展开成正文`}
            onEditorReady={setEditorInstance}
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>文章设置</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" suppressHydrationWarning>
            <TabsList
              className="w-full"
              suppressHydrationWarning
            >
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
                    开启后文章将对所有访客可见
                  </span>
                </div>
                <Switch
                  id="status"
                  checked={form.status === "published"}
                  onCheckedChange={(checked) =>
                    patchForm({ status: checked ? "published" : "draft" })
                  }
                  suppressHydrationWarning
                />
              </div>

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
                  <img
                    src={form.coverImageUrl}
                    alt="封面预览"
                    className="mt-1 h-32 w-full rounded-lg border object-cover"
                  />
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="seoTitle">SEO 标题</Label>
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
                <Label htmlFor="seoDescription">SEO 描述</Label>
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
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
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
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && deleteConfirm.handleCancel()}
        title="删除文章"
        description="确定删除这篇文章吗？发布后的内容将对读者不可见，此操作不可撤销。"
        confirmText="删除"
        variant="destructive"
        onConfirm={deleteConfirm.handleConfirm}
      />

      <ConfirmDialog
        open={leaveConfirm.open}
        onOpenChange={(open) => !open && leaveConfirm.handleCancel()}
        title="放弃未保存内容"
        description="当前有未保存内容，确认丢弃并切换文章吗？"
        confirmText="丢弃"
        variant="destructive"
        onConfirm={leaveConfirm.handleConfirm}
      />
    </div>
  );
}
