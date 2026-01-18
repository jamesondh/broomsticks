import { useState, useCallback, useEffect } from 'react';
import { useGuestbookSearch } from '../hooks/useGuestbookSearch';
import type { SearchResult } from '../types/guestbook';
import './GuestbookSearch.css';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function GuestbookSearch() {
  const { search, results, isLoading, error, totalEntries, clearResults } = useGuestbookSearch();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, search, clearResults]);

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
          <img src="/guestbook/images/intro.gif" alt="Broomsticks by Paul Rajlich" />
          <h1>Guestbook Search</h1>
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
                {query.trim() ? (
                  `${results.length} result${results.length !== 1 ? 's' : ''} found`
                ) : (
                  `${totalEntries.toLocaleString()} total entries`
                )}
              </div>

              {query.trim() && results.length === 0 && (
                <div className="guestbook-search__no-results">
                  No entries match your search.
                </div>
              )}

              {results.length > 0 && (
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
            </>
          )}

          <div className="guestbook-search__browse">
            <a href="/guestbook/guestbook.html">Browse all entries</a>
          </div>
        </div>
      </div>
    </div>
  );
}
