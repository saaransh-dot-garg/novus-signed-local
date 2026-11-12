const TOKEN_KEY = "fieldnotes.admin.token";

export type Role = "researcher" | "admin";
export type Plan = "free" | "team" | "enterprise";

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
  organization: { id: string; name: string; plan: Plan; seats: number };
}

export interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Billing {
  plan: Plan;
  billingEmail: string;
  seats: number;
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
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminProfile }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<AdminProfile>("/auth/me"),

  listMembers: () => request<Member[]>("/admin/users"),
  updateMember: (id: string, changes: Partial<Pick<Member, "role" | "active">>) =>
    request<Member>(`/admin/users/${id}`, { method: "PATCH", body: changes }),

  getBilling: () => request<Billing>("/admin/billing"),
  updateBilling: (billing: Billing) =>
    request<Billing>("/admin/billing", { method: "PUT", body: billing }),
};
