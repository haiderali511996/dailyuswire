export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type Role = 'admin' | 'editor' | 'author';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  meta_title: string;
  meta_description: string;
  color: string;
  icon: string;
  position: number;
  is_active: boolean;
  post_count?: number;
}

export interface Author {
  id: number;
  name: string;
  slug: string;
  bio: string;
  avatar: string;
  twitter: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface PostImage {
  id?: number;
  url: string;
  alt: string;
  caption: string;
  credit: string;
  position: number;
}

export interface PostCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  cover_alt: string;
  published_at: string | null;
  reading_time: number;
  views: number;
  is_featured: boolean;
  is_breaking: boolean;
  category: Category | null;
  author: Author | null;
}

export interface Post extends PostCard {
  content: string;
  cover_caption: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  focus_keyword: string;
  canonical_url: string;
  og_image: string;
  no_index: boolean;
  is_editors_pick: boolean;
  source_name: string;
  source_url: string;
  tags: Tag[];
  images: PostImage[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface User {
  id: number;
  name: string;
  slug: string;
  email: string;
  role: Role;
  bio: string;
  avatar: string;
  twitter: string;
  is_active: boolean;
}

export interface MediaItem {
  id: number;
  filename: string;
  url: string;
  thumb_url: string;
  mime: string;
  width: number;
  height: number;
  size_bytes: number;
  alt: string;
  created_at: string;
}

export interface FeedSource {
  id: number;
  name: string;
  url: string;
  homepage: string;
  category_slug: string;
  is_active: boolean;
  last_fetched_at: string | null;
  last_status: string;
}

export interface FeedItem {
  id: number;
  title: string;
  summary: string;
  link: string;
  image: string;
  author: string;
  category_slug: string;
  published_at: string | null;
  imported_post_id: number | null;
  source: FeedSource | null;
}

export interface SeoCheck {
  ok: boolean;
  label: string;
  hint: string;
  weight: number;
}

export interface SeoAnalysis {
  score: number;
  grade: 'good' | 'ok' | 'poor';
  word_count: number;
  checks: SeoCheck[];
}

export interface DashboardStats {
  total_posts: number;
  published: number;
  drafts: number;
  scheduled: number;
  total_views: number;
  subscribers: number;
  pending_feed_items: number;
  per_category: { name: string; slug: string; count: number }[];
  recent: PostCard[];
}
