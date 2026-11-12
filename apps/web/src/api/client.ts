const TOKEN_KEY = "fieldnotes.token";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: "researcher" | "admin";
  active: boolean;
  createdAt: string;
  organization: { id: string; name: string; plan: string; seats: number };
}

export interface NotebookSummary {
  id: string;
  title: string;
  noteCount: number;
  shared: boolean;
  updatedAt: string;
}

export interface Note {
  id: string;
  body: string;
  updatedAt: string;
}

export interface NotebookDetail extends NotebookSummary {
  notes: Note[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = tokenStore.get();
  const response = await fetch(`/api${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, payload.error ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: Profile }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<Profile>("/auth/me"),
  updateMe: (name: string) => request<Profile>("/auth/me", { method: "PATCH", body: { name } }),

  listNotebooks: () => request<NotebookSummary[]>("/notebooks"),
  createNotebook: (title: string) =>
    request<NotebookSummary>("/notebooks", { method: "POST", body: { title } }),
  getNotebook: (id: string) => request<NotebookDetail>(`/notebooks/${id}`),
  renameNotebook: (id: string, title: string) =>
    request<NotebookSummary>(`/notebooks/${id}`, { method: "PATCH", body: { title } }),
  deleteNotebook: (id: string) => request<void>(`/notebooks/${id}`, { method: "DELETE" }),
  addNote: (notebookId: string, body: string) =>
    request<Note>(`/notebooks/${notebookId}/notes`, { method: "POST", body: { body } }),
  updateNote: (notebookId: string, noteId: string, body: string) =>
    request<Note>(`/notebooks/${notebookId}/notes/${noteId}`, { method: "PATCH", body: { body } }),
  shareNotebook: (id: string) =>
    request<{ shareUrl: string }>(`/notebooks/${id}/share`, { method: "POST" }),

  askAssistant: (messages: ChatMessage[]) =>
    request<{ reply: string; model: string | null }>("/assistant", {
      method: "POST",
      body: { messages },
    }),
};
