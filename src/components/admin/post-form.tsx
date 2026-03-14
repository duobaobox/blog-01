"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { pinyin } from "pinyin-pro";
import readingTime from "reading-time";
import slugify from "slugify";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import {
  deletePost,
  createPost,
  updatePost,
} from "@/features/posts/actions/post.actions";
import type { Editor } from "@tiptap/core";
import {
  EditorToolbar,
  PostRichEditor,
} from "@/components/admin/post-rich-editor";
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

function generateSlug(title: string) {
  if (!title.trim()) return "untitled-post";

  let slug = slugify(title, { lower: true, strict: true });

  if (!slug) {
    const py = pinyin(title, { toneType: "none", type: "array" }).join("-");
    slug = slugify(py, { lower: true, strict: true });
  }

  if (!slug) {
    slug = `post-${Date.now()}`;
  }

  return slug;
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

export function PostForm({
  post,
  categories,
  tags,
  onDirtyChange,
}: PostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createFormState(post));
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const baselineRef = useRef(createSnapshot(createFormState(post)));

  useEffect(() => {
    const nextForm = createFormState(post);
    baselineRef.current = createSnapshot(nextForm);
    setForm(nextForm);
    setIsDirty(false);
  }, [post]);

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

  const readingStats = readingTime(form.contentMarkdown);
  const wordCount = readingStats.words;
  const readingMinutes =
    wordCount > 0 ? Math.max(1, Math.ceil(readingStats.minutes)) : 0;

  function patchForm(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function toggleTag(tagId: string) {
    patchForm({
      selectedTagIds: form.selectedTagIds.includes(tagId)
        ? form.selectedTagIds.filter((id) => id !== tagId)
        : [...form.selectedTagIds, tagId],
    });
  }

  async function handleSubmit(targetStatus = form.status) {
    setSaving(true);

    const finalSlug = post?.slug || generateSlug(form.title);
    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("slug", finalSlug);
    formData.set("excerpt", form.excerpt);
    formData.set("coverImageUrl", form.coverImageUrl);
    formData.set("contentJson", form.contentJson);
    formData.set("contentMarkdown", form.contentMarkdown);
    formData.set("categoryId", form.categoryId);
    formData.set("status", targetStatus);
    formData.set("isFeatured", form.isFeatured.toString());
    formData.set("seoTitle", form.seoTitle);
    formData.set("seoDescription", form.seoDescription);
    formData.set("canonicalUrl", form.canonicalUrl);
    form.selectedTagIds.forEach((id) => formData.append("tagIds", id));

    try {
      const savedPost = post
        ? await updatePost(post.id, formData)
        : await createPost(formData);

      const nextForm = { ...form, status: savedPost.status };
      baselineRef.current = createSnapshot(nextForm);
      setForm(nextForm);
      setIsDirty(false);

      startTransition(() => {
        router.push(`/admin/posts?postId=${savedPost.id}`);
        router.refresh();
      });
    } catch {
      window.alert("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !window.confirm("确定删除这篇文章吗？")) return;

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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {post ? "编辑文章" : "新建文章"}
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
            {saving ? "保存中..." : isDirty ? "未保存" : "已保存"}
          </span>

          {post ? (
            <Button
              variant="ghost"
              size="icon-sm"
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
            disabled={saving || !form.title.trim()}
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
          />

          <PostRichEditor
            key={post?.id ?? "new"}
            initialJson={form.contentJson}
            initialMarkdown={form.contentMarkdown}
            placeholder={`从一句清晰的开头开始。\n\n# 可以像这样写标题\n- 或者先列出要点\n- 再慢慢展开成正文`}
            onEditorReady={setEditorInstance}
            onChange={({ json, markdown }) =>
              patchForm({
                contentJson: json,
                contentMarkdown: markdown,
              })
            }
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>文章设置</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList variant="line" className="w-full justify-start p-0">
              <TabsTrigger value="basic">基础</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-5 flex flex-col gap-4">
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
                  <SelectTrigger id="category" className="h-9 rounded-lg">
                    <SelectValue placeholder="选择分类" />
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
                <div className="flex flex-wrap gap-1.5">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={
                          form.selectedTagIds.includes(tag.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer rounded-full px-2.5 py-0.5"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无标签</p>
                  )}
                </div>
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
                <Input
                  id="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={(event) =>
                    patchForm({ coverImageUrl: event.target.value })
                  }
                  placeholder="https://..."
                  className="h-9 rounded-lg"
                />
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
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-5 flex flex-col gap-4">
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
    </div>
  );
}
