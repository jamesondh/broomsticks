import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import type { SearchableEntry, SearchResult } from '../types/guestbook';

const ENTRIES_URL = '/guestbook/data/entries.json';

const fuseOptions: IFuseOptions<SearchableEntry> = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'comments', weight: 0.35 },
    { name: 'from', weight: 0.15 },
    { name: 'response', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
};

export function useGuestbookSearch() {
  const [entries, setEntries] = useState<SearchableEntry[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fuseRef = useRef<Fuse<SearchableEntry> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEntries() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(ENTRIES_URL);
        if (!response.ok) {
          throw new Error(`Failed to load entries: ${response.status}`);
        }
        const data: SearchableEntry[] = await response.json();

        if (mounted) {
          setEntries(data);
          fuseRef.current = new Fuse(data, fuseOptions);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load entries');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      mounted = false;
    };
  }, []);

  const search = useCallback((query: string): SearchResult[] => {
    if (!query.trim() || !fuseRef.current) {
      setResults([]);
      return [];
    }

    const searchResults = fuseRef.current.search(query);
    const mappedResults: SearchResult[] = searchResults.map((result) => ({
      item: result.item,
      score: result.score,
    }));

    setResults(mappedResults);
    return mappedResults;
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    entries,
    results,
    search,
    clearResults,
    isLoading,
    error,
    totalEntries: entries.length,
  };
}
