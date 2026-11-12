import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { adminApi, tokenStore, type AdminProfile } from "../api/client";

interface AdminAuthState {
  admin: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

function identifyVisitor(profile: AdminProfile) {
  pendo.identify({
    visitor: {
      id: profile.id,
      email: profile.email,
      full_name: profile.name,
      role: profile.role,
      organizationId: profile.organization.id,
      active: profile.active,
      createdAt: profile.createdAt,
    },
    account: {
      id: profile.organization.id,
      name: profile.organization.name,
      plan: profile.organization.plan,
      seats: profile.organization.seats,
    },
  });
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);

  // Runs after sign-in and session restore so Novus has the signed-in admin's metadata.
  useEffect(() => {
    if (admin) identifyVisitor(admin);
  }, [admin]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    adminApi
      .me()
      .then((profile) => {
        if (profile.role === "admin") setAdmin(profile);
        else tokenStore.clear();
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const { token, user } = await adminApi.login(email, password);
    if (user.role !== "admin") {
      tokenStore.set(token);
      await adminApi.logout().catch(() => undefined);
      tokenStore.clear();
      throw new Error("This portal is for organization admins only");
    }
    tokenStore.set(token);
    setAdmin(user);
  };

  const signOut = async () => {
    try {
      await adminApi.logout();
    } finally {
      tokenStore.clear();
      setAdmin(null);
      pendo.clearSession();
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
