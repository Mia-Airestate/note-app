export interface Page {
  id: string;
  title: string;
  markdown: string;  // Single source of truth
  createdAt: number;
  updatedAt: number;
}

