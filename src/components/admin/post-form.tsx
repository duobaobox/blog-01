"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, deletePost } from "@/features/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import slugify from "slugify";

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
  contentMarkdown: string;
  status: string;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  isFeatured: boolean;
  tags: { tag: Tag }[];
}

interface PostFormProps {
  post?: PostData;
  categories: Category[];
  tags: Tag[];
}

export function PostForm({ post, categories, tags }: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [content, setContent] = useState(post?.contentMarkdown ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags.map((t) => t.tag.id) ?? [],
  );
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured ?? false);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seoDescription ?? "",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [showSeo, setShowSeo] = useState(false);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  async function handleSubmit(status: string) {
    setSaving(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug || slugify(title, { lower: true, strict: true }));
    formData.set("excerpt", excerpt);
    formData.set("coverImageUrl", coverImageUrl);
    formData.set("contentMarkdown", content);
    formData.set("categoryId", categoryId);
    formData.set("status", status);
    formData.set("isFeatured", isFeatured.toString());
    formData.set("seoTitle", seoTitle);
    formData.set("seoDescription", seoDescription);
    formData.set("canonicalUrl", canonicalUrl);
    selectedTagIds.forEach((id) => formData.append("tagIds", id));

    try {
      if (post) {
        await updatePost(post.id, formData);
      } else {
        await createPost(formData);
      }
      router.push("/admin/posts");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !confirm("确定删除此文章？")) return;
    await deletePost(post.id);
    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{post ? "编辑文章" : "新建文章"}</h1>
        <div className="flex gap-2">
          {post && (
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          )}
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => handleSubmit("draft")}
          >
            {saving ? "保存中..." : "保存草稿"}
          </Button>
          <Button disabled={saving} onClick={() => handleSubmit("published")}>
            {saving ? "发布中..." : "发布"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!post)
                  setSlug(
                    slugify(e.target.value, { lower: true, strict: true }),
                  );
              }}
              placeholder="文章标题"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-slug"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">内容 (Markdown)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="使用 Markdown 编写文章内容..."
              rows={20}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">无分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      selectedTagIds.includes(tag.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-muted-foreground">暂无标签</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">摘要</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="文章摘要（留空则自动截取）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">封面图 URL</Label>
              <Input
                id="coverImageUrl"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
              <Label htmlFor="featured">置顶文章</Label>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <button
              type="button"
              className="w-full text-left text-sm font-medium"
              onClick={() => setShowSeo(!showSeo)}
            >
              SEO 设置 {showSeo ? "▾" : "▸"}
            </button>
            {showSeo && (
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO 标题</Label>
                  <Input
                    id="seoTitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO 描述</Label>
                  <Textarea
                    id="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input
                    id="canonicalUrl"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
