import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Heart,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import type { MediaPresentation } from "@/features/media/queries/media.queries";
import styles from "./home-hero.module.css";

type HomeHeroCategory = {
  id: string;
  name: string;
  slug: string;
};

type HomeHeroProps = {
  siteName: string;
  subtitle?: string;
  description: string;
  avatar?: MediaPresentation;
  categories: HomeHeroCategory[];
  postCount: number;
  showingFeaturedPosts: boolean;
};

const topicIcons = [Code2, Lightbulb, BookOpen, Heart];

const fallbackTopics = [
  { id: "latest", name: "最新文章", href: "/blog" },
  { id: "ideas", name: "灵感记录", href: "/blog" },
  { id: "notes", name: "学习笔记", href: "/blog" },
  { id: "life", name: "生活随笔", href: "/blog" },
];

export function HomeHero({
  siteName,
  subtitle,
  description,
  avatar,
  categories,
  postCount,
  showingFeaturedPosts,
}: HomeHeroProps) {
  const intro = subtitle?.trim() || description.trim();
  const topics =
    categories.length > 0
      ? categories.slice(0, 4).map((category) => ({
          id: category.id,
          name: category.name,
          href: `/blog/categories/${category.slug}`,
        }))
      : fallbackTopics;

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.orb} />
      <div className={styles.dotGrid} aria-hidden="true" />
      <span className={styles.sparkleOne} aria-hidden="true">
        ✦
      </span>
      <span className={styles.sparkleTwo} aria-hidden="true">
        ✦
      </span>

      <div className={styles.content}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <Sparkles aria-hidden="true" />
            Welcome to my space
          </p>

          <div className={styles.titleLine}>
            <span className={styles.hi} aria-hidden="true">
              Hi~
            </span>
            <h1 id="home-hero-title" className={styles.title}>
              欢迎来到
              <span>{siteName}</span>
            </h1>
          </div>

          <p className={styles.intro}>{intro}</p>

          <div className={styles.actions}>
            <Link href="/blog" className={styles.primaryAction}>
              阅读博客
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/about" className={styles.secondaryAction}>
              关于我
            </Link>
          </div>

          <nav className={styles.topics} aria-label="首页内容分类">
            {topics.map((topic, index) => {
              const Icon = topicIcons[index % topicIcons.length];

              return (
                <Link key={topic.id} href={topic.href} className={styles.topic}>
                  <Icon aria-hidden="true" />
                  <span>{topic.name}</span>
                </Link>
              );
            })}
          </nav>

          <blockquote className={styles.quote}>
            <span className={styles.quoteMark} aria-hidden="true">
              “
            </span>
            <p>把灵感放进文字，让每一次思考都能被重新找到。</p>
            <span className={styles.quoteLine} aria-hidden="true" />
          </blockquote>
        </div>

        <div className={styles.scene} aria-hidden="true">
          <div className={styles.codeBubble}>
            <Code2 />
          </div>

          <div className={styles.articleBubble}>
            <span className={styles.articleThumb} />
            <span className={styles.articleLines}>
              <i />
              <i />
              <i />
            </span>
          </div>

          <div className={styles.heartBubble}>
            <Heart />
          </div>

          <div className={styles.statusCard}>
            <span>{showingFeaturedPosts ? "本期精选" : "最近更新"}</span>
            {postCount > 0 ? (
              <strong>
                {postCount}
                <small>篇文章</small>
              </strong>
            ) : (
              <strong className={styles.preparing}>内容准备中</strong>
            )}
          </div>

          <div className={styles.avatarHalo}>
            <div className={styles.avatarFrame}>
              {avatar ? (
                <Image
                  src={avatar.url}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 260px, 220px"
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarFallback}>
                  {siteName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className={styles.desk}>
            <div className={styles.plant}>
              <span />
              <span />
              <span />
              <i />
            </div>

            <div className={styles.mug}>
              <span>⌣</span>
            </div>

            <div className={styles.laptop}>
              <div className={styles.laptopLogo}>
                {siteName.slice(0, 1).toUpperCase()}
              </div>
              <i />
            </div>

            <div className={styles.books}>
              <span>IDEAS</span>
              <span>NOTES</span>
              <span>STORIES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
