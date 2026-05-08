import { Article } from "../lib/newsapi";

const PLACEHOLDER = "/placeholder.svg";

interface Props {
  article: Article | null;
  articleIndex: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
  isFavorite: (uuid: string) => boolean;
  onToggleFavorite: (a: Article) => void;
  onPrev: () => void;
  onNext: () => void;
  // For live view: absolute article numbers shown in pager
  pagerNumbers?: number[];
  absArticle?: number;
  onGoIndex: (abs: number) => void;
  totalPages: number;
  currentPage: number;
  onGoPage: (pg: number) => void;
  isFavoritesView?: boolean;
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : text;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function HeadlinesList({
  article, articleIndex, totalItems, loading, error,
  isFavorite, onToggleFavorite,
  onPrev, onNext, pagerNumbers, absArticle, onGoIndex,
  totalPages, currentPage, onGoPage, isFavoritesView,
}: Props) {
  if (loading) {
    return (
      <div className="card card--skeleton" aria-busy="true" aria-label="Loading articles">
        <div className="skeleton skeleton--image" />
        <div className="skeleton-body">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card--error" role="alert">
        <p className="error-msg">{error}</p>
      </div>
    );
  }

  if (!article || totalItems === 0) {
    return (
      <div className="card card--empty" role="status">
        <p>{isFavoritesView ? "No favorites saved yet." : "No articles found."}</p>
      </div>
    );
  }

  const fav = isFavorite(article.uuid);
  const imgSrc = article.image_url || PLACEHOLDER;

  // Favorites view pager
  const favTotal = isFavoritesView ? totalItems : 0;
  const favIndex = isFavoritesView ? articleIndex : 0;

  return (
    <div className="featured-wrapper">
      <article className="card featured-card" aria-label={article.title}>
        <div className="card-image-wrap">
          <img
            className="card-image"
            src={imgSrc}
            alt={article.title}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
          />
          <div className="card-overlay">
            <div className="card-meta">
              <span className="card-source">{article.source}</span>
              {article.categories.length > 0 && (
                <span className="card-categories">{article.categories.join(", ")}</span>
              )}
            </div>

            <h2 className="card-title">{article.title}</h2>
            <span className="card-date">{formatDate(article.published_at)}</span>

            {article.description && (
              <p className="card-description">{firstSentence(article.description)}</p>
            )}

            <div className="card-actions">
              <a
                className="btn btn--primary"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View full article: ${article.title}`}
              >
                View Full Article ↗
              </a>
              <button
                className={`btn btn--fav${fav ? " btn--fav-active" : ""}`}
                onClick={() => onToggleFavorite(article)}
                aria-pressed={fav}
                aria-label={fav ? "Remove from favorites" : "Save to favorites"}
              >
                {fav ? "★ Saved" : "☆ Save to Favorites"}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Pager */}
      <nav className="pager" aria-label="Article navigation">
        {isFavoritesView ? (
          <>
            <button
              className="pager-btn"
              onClick={() => onGoIndex(0)}
              disabled={favIndex === 0}
              aria-label="First article"
            >«</button>
            <button
              className="pager-btn"
              onClick={onPrev}
              disabled={favIndex === 0}
              aria-label="Previous article"
            >‹</button>
            {Array.from({ length: favTotal }, (_, i) => i).slice(
              Math.max(0, favIndex - 1),
              Math.max(3, favIndex + 2)
            ).map((i) => (
              <button
                key={i}
                className={`pager-btn pager-btn--num${i === favIndex ? " pager-btn--active" : ""}`}
                onClick={() => onGoIndex(i)}
                aria-label={`Article ${i + 1}`}
                aria-current={i === favIndex ? "page" : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pager-btn"
              onClick={onNext}
              disabled={favIndex >= favTotal - 1}
              aria-label="Next article"
            >›</button>
          </>
        ) : (
          <>
            <button
              className="pager-btn"
              onClick={() => onGoPage(1)}
              disabled={currentPage === 1 && articleIndex === 0}
              aria-label="First page"
            >«</button>
            <button
              className="pager-btn"
              onClick={onPrev}
              disabled={absArticle === 1}
              aria-label="Previous article"
            >‹</button>
            {(pagerNumbers ?? []).map((n) => (
              <button
                key={n}
                className={`pager-btn pager-btn--num${n === absArticle ? " pager-btn--active" : ""}`}
                onClick={() => onGoIndex(n)}
                aria-label={`Article ${n}`}
                aria-current={n === absArticle ? "page" : undefined}
              >
                {n}
              </button>
            ))}
            <button
              className="pager-btn"
              onClick={onNext}
              disabled={(absArticle ?? 0) >= totalItems}
              aria-label="Next article"
            >›</button>
          </>
        )}
      </nav>
    </div>
  );
}
