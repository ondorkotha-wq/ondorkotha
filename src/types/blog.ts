interface BlogCategory {
  name: string;
}

interface BlogSubCategory {
  id: number;
  name: string;
  slug?: string;
}

interface BlogTag {
  id: number;
  name: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug?: string;
  content: string;
  image?: string | null;
  published?: boolean;
  categoryId?: number | null;
  tags?: BlogTag[];
  createdAt: string;
  updatedAt?: string;
  category?: BlogCategory & { id?: number; slug?: string };
  subCategories?: BlogSubCategory[];
}
