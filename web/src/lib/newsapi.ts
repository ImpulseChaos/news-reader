export interface Article {
  uuid: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  published_at: string;
  source: string;
  categories: string[];
  snippet: string;
}

export interface NewsPage {
  meta: { found: number; returned: number; limit: number; page: number };
  data: Article[];
}

export type FetchParams =
  | { kind: "category"; category: string; page: number }
  | { kind: "search"; query: string; page: number };

function buildUrl(p: FetchParams): string {
  const base = "/api/news/all";
  const params = new URLSearchParams({ page: String(p.page) });
  if (p.kind === "category") {
    params.set("categories", p.category);
  } else {
    params.set("search", p.query);
  }
  const url = `${base}?${params.toString()}`;
  console.log("[newsapi] proxied request →", url);
  return url;
}

export async function fetchPage(p: FetchParams): Promise<NewsPage> {
  const res = await fetch(buildUrl(p));

  if (res.status === 429) {
    throw new Error("Daily request limit reached. Try again tomorrow.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("TheNewsApi authentication failed. Check your token.");
  }
  if (!res.ok) {
    throw new Error(`Unexpected error (${res.status}). Please try again.`);
  }

  return res.json() as Promise<NewsPage>;
}
