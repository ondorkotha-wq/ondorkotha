export interface SeoEntry {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noIndex: boolean;
  noFollow: boolean;
  createdAt: string;
  updatedAt: string;
}
