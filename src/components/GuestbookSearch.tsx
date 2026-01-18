import { useState, useCallback, useEffect } from 'react';
import { useGuestbookSearch } from '../hooks/useGuestbookSearch';
import { ARCHIVE_LINKS } from '../data/archiveLinks';
import type { SearchResult } from '../types/guestbook';
import './GuestbookSearch.css';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function GuestbookSearch() {
  const { search, results, isLoading, error, totalEntries, clearResults } = useGuestbookSearch();
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const hasSearchQuery = query.trim().length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedQuery.trim()) {
      params.set('q', debouncedQuery.trim());
    } else {
      params.delete('q');
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, search, clearResults, totalEntries]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const getEntryUrl = (result: SearchResult): string => {
    return `/guestbook/${result.item.sourceFile}#${result.item.id}`;
  };

  return (
    <div className="guestbook-search">
      <div className="guestbook-search__container">
        <header className="guestbook-search__header">
          <img src="/images/intro.gif" alt="Broomsticks by Paul Rajlich" />
          <h1>Guestbook</h1>
        </header>

        <div className="guestbook-search__card">
          <div className="guestbook-search__input-wrapper">
            <input
              type="text"
              className="guestbook-search__input"
              placeholder="Search by name, location, or message..."
              value={query}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="guestbook-search__loading">Loading entries...</div>
          )}

          {error && (
            <div className="guestbook-search__error">{error}</div>
          )}

          {!isLoading && !error && (
            <>
              <div className="guestbook-search__stats">
                {hasSearchQuery ? (
                  `${results.length} result${results.length !== 1 ? 's' : ''} found`
                ) : (
                  `${totalEntries.toLocaleString()} total entries`
                )}
              </div>

              {hasSearchQuery && results.length === 0 && (
                <div className="guestbook-search__no-results">
                  No entries match your search.
                </div>
              )}

              {hasSearchQuery && results.length > 0 && (
                <ul className="guestbook-search__results">
                  {results.slice(0, 50).map((result) => (
                    <li key={`${result.item.sourceFile}-${result.item.id}`} className="guestbook-search__result">
                      <a href={getEntryUrl(result)} className="guestbook-search__result-link">
                        {result.item.name || 'Anonymous'}
                      </a>
                      <div className="guestbook-search__result-meta">
                        {result.item.from && <span>From: {result.item.from}</span>}
                        {result.item.from && result.item.date && <span> &bull; </span>}
                        {result.item.date && <span>{result.item.date}</span>}
                      </div>
                      {result.item.comments && (
                        <div className="guestbook-search__result-preview">
                          {truncate(result.item.comments, 150)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {!hasSearchQuery && (
                <div className="guestbook-search__archive">
                  <p className="guestbook-search__notice">
                    Sign Guestbook<br />
                    <small>January, 2006: guestbook signing has been disabled due to abuse by spammers.</small>
                  </p>
                  <p>View Guestbook:</p>
                  <ul className="guestbook-search__archive-list">
                    {ARCHIVE_LINKS.map((link) => (
                      <li key={link.filename}>
                        <a href={`/guestbook/${link.filename}`}>View {link.label} entries</a>
                        {link.count && ` (${link.count})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
