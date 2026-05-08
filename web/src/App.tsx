import { useState, useEffect, useCallback, useRef } from "react";
import { fetchPage, Article, NewsPage, FetchParams } from "./lib/newsapi";
import HeadlinesList from "./components/HeadlinesList";

const CATEGORIES = [
  "tech", "general", "science", "sports", "business",
  "health", "entertainment", "politics", "food", "travel",
];

const FAVORITES_KEY = "nr_favorites";

function loadFavorites(): Article[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveFavorites(favs: Article[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export default function App() {
  const [category, setCategory] = useState("tech");
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [articleIndex, setArticleIndex] = useState(0);

  const [items, setItems] = useState<Article[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Article[]>(loadFavorites);
  const [showFavorites, setShowFavorites] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // page cache: key → NewsPage
  const cache = useRef<Map<string, NewsPage>>(new Map());
  // prefetch in-flight guard
  const prefetchRef = useRef<Set<string>>(new Set());

  function cacheKey(p: FetchParams): string {
    if (p.kind === "category") return `cat:${p.category}:${p.page}`;
    return `search:${p.query}:${p.page}`;
  }

  function buildParams(pg: number): FetchParams {
    if (committedSearch.trim()) {
      return { kind: "search", query: committedSearch.trim(), page: pg };
    }
    return { kind: "category", category, page: pg };
  }

  const loadPage = useCallback(
    async (pg: number, invalidateCache = false) => {
      const params = buildParams(pg);
      const key = cacheKey(params);

      if (invalidateCache) cache.current.delete(key);

      if (cache.current.has(key)) {
        const cached = cache.current.get(key)!;
        setItems(cached.data);
        setTotalFound(cached.meta.found);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchPage(params);
        cache.current.set(key, result);
        setItems(result.data);
        setTotalFound(result.meta.found);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, committedSearch]
  );

  const prefetch = useCallback(
    (pg: number) => {
      const params = buildParams(pg);
      const key = cacheKey(params);
      if (cache.current.has(key) || prefetchRef.current.has(key)) return;
      prefetchRef.current.add(key);
      fetchPage(params)
        .then((result) => {
          cache.current.set(key, result);
        })
        .catch(() => {})
        .finally(() => prefetchRef.current.delete(key));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, committedSearch]
  );

  // Load current page whenever page/category/search changes
  useEffect(() => {
    setArticleIndex(0);
    loadPage(page);
  }, [page, loadPage]);

  // Prefetch adjacent pages based on article index
  useEffect(() => {
    if (loading) return;
    const totalPages = Math.ceil(totalFound / 3);
    if (articleIndex >= 1 && page < totalPages) prefetch(page + 1);
    if (articleIndex === 0 && page > 1) prefetch(page - 1);
  }, [articleIndex, page, totalFound, loading, prefetch]);

  // Reset on filter change
  function handleCategoryChange(cat: string) {
    cache.current.clear();
    setCategory(cat);
    setCommittedSearch("");
    setSearchInput("");
    setPage(1);
    setArticleIndex(0);
    setShowFavorites(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    cache.current.clear();
    setCommittedSearch(searchInput.trim());
    setPage(1);
    setArticleIndex(0);
    setShowFavorites(false);
  }

  function handleClearSearch() {
    setSearchInput("");
    setCommittedSearch("");
    cache.current.clear();
    setPage(1);
    setArticleIndex(0);
  }

  // Article navigation
  const totalPages = Math.ceil(totalFound / 3);

  function goArticle(idx: number) {
    if (idx < 0) {
      if (page > 1) { setPage((p) => p - 1); setArticleIndex(2); }
      return;
    }
    if (idx >= items.length) {
      if (page < totalPages) { setPage((p) => p + 1); setArticleIndex(0); }
      return;
    }
    setArticleIndex(idx);
  }

  function goPage(pg: number) {
    setPage(pg);
    setArticleIndex(0);
  }

  // Absolute article number across all pages (1-based display)
  const absArticle = (page - 1) * 3 + articleIndex + 1;
  const totalArticles = totalFound;

  // Pager window: show 3 absolute article numbers
  function pagerNumbers(): number[] {
    if (totalArticles <= 3) return Array.from({ length: totalArticles }, (_, i) => i + 1);
    if (absArticle === 1) return [1, 2, 3];
    if (absArticle >= totalArticles) return [totalArticles - 2, totalArticles - 1, totalArticles];
    return [absArticle - 1, absArticle, absArticle + 1];
  }

  function goAbsArticle(abs: number) {
    const pg = Math.ceil(abs / 3);
    const idx = (abs - 1) % 3;
    if (pg === page) {
      setArticleIndex(idx);
    } else {
      setPage(pg);
      setArticleIndex(idx);
    }
  }

  // Favorites
  function toggleFavorite(article: Article) {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.uuid === article.uuid);
      const next = exists ? prev.filter((f) => f.uuid !== article.uuid) : [...prev, article];
      saveFavorites(next);
      return next;
    });
  }

  function isFavorite(uuid: string) {
    return favorites.some((f) => f.uuid === uuid);
  }

  const displayItems = showFavorites ? favorites : items;
  const displayIndex = showFavorites ? Math.min(articleIndex, Math.max(0, favorites.length - 1)) : articleIndex;
  const currentArticle = displayItems[displayIndex] ?? null;

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-logo">NewsReader</span>
      </header>

      <div className="app-body">
        {/* Mobile filter toggle */}
        <button
          className="filter-toggle-btn"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          {filtersOpen ? "Hide Filters" : "Show Filters"}
        </button>

        <aside className={`sidebar${filtersOpen ? " sidebar--open" : ""}`} aria-label="Filters">
          <form className="search-form" onSubmit={handleSearch} role="search">
            <label className="sidebar-label" htmlFor="search-input">Search</label>
            <div className="search-row">
              <input
                id="search-input"
                className="search-input"
                type="search"
                placeholder="Keywords…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search articles"
              />
              <button className="btn btn--primary" type="submit">Go</button>
            </div>
            {committedSearch && (
              <button type="button" className="btn btn--ghost clear-btn" onClick={handleClearSearch}>
                ✕ Clear search
              </button>
            )}
          </form>

          {!committedSearch && (
            <nav aria-label="Categories">
              <span className="sidebar-label">Category</span>
              <ul className="category-list" role="list">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <button
                      className={`category-btn${category === cat && !showFavorites ? " category-btn--active" : ""}`}
                      onClick={() => handleCategoryChange(cat)}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="sidebar-bottom">
            <button
              className={`btn btn--favorites${showFavorites ? " btn--favorites-active" : ""}`}
              onClick={() => {
                setShowFavorites((v) => !v);
                setArticleIndex(0);
              }}
            >
              {showFavorites ? "← Back to News" : `★ Favorites (${favorites.length})`}
            </button>
          </div>
        </aside>

        <main className="content-area" role="main">
          {showFavorites ? (
            <HeadlinesList
              article={currentArticle}
              articleIndex={displayIndex}
              totalItems={favorites.length}
              loading={false}
              error={null}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onPrev={() => setArticleIndex((i) => Math.max(0, i - 1))}
              onNext={() => setArticleIndex((i) => Math.min(favorites.length - 1, i + 1))}
              onGoIndex={setArticleIndex}

              currentPage={1}
              onGoPage={() => {}}
              isFavoritesView
            />
          ) : (
            <HeadlinesList
              article={currentArticle}
              articleIndex={articleIndex}
              totalItems={totalArticles}
              loading={loading}
              error={error}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onPrev={() => goArticle(articleIndex - 1)}
              onNext={() => goArticle(articleIndex + 1)}
              onGoIndex={goAbsArticle}
              pagerNumbers={pagerNumbers()}
              absArticle={absArticle}

              currentPage={page}
              onGoPage={goPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
