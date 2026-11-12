/** Browser notebook object events — pairs with apps/api analytics routes. */

declare global {
  interface Window {
    pendo?: {
      track: (eventName: string, metadata?: Record<string, string | boolean | number>) => void;
    };
  }
}

export interface NotebookObjectMetadata {
  notebookId: string;
  organizationId?: string;
  noteId?: string;
  noteCount?: number;
  notebookShared?: boolean;
}

export function trackNotebookObjectEvent(
  eventName: string,
  metadata: NotebookObjectMetadata
): void {
  window.pendo?.track(eventName, metadata);
}
