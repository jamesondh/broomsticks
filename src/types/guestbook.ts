export interface SearchableEntry {
  id: string;
  sourceFile: string;
  name: string;
  from: string;
  date: string;
  comments: string;
  response: string;
  hasResponse: boolean;
}

export interface SearchResult {
  item: SearchableEntry;
  score?: number;
}
