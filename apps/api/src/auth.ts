import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { organizations, users, type Organization, type User } from "./store.js";

const sessions = new Map<string, string>();

export interface AuthedLocals {
  user: User;
  organization: Organization;
  token: string;
}

export function startSession(user: User): string {
  const token = randomUUID();
  sessions.set(token, user.id);
  return token;
}

export function endSession(token: string): void {
  sessions.delete(token);
}

export function toProfile(user: User, organization: Organization) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    organization: {
      id: organization.id,
      name: organization.name,
      plan: organization.plan,
      seats: organization.seats,
    },
  };
}

export function requireAuth(
  req: Request,
  res: Response<unknown, AuthedLocals>,
  next: NextFunction
) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const userId = token ? sessions.get(token) : undefined;
  const user = userId ? users.get(userId) : undefined;
  const organization = user ? organizations.get(user.organizationId) : undefined;
  if (!token || !user || !organization || !user.active) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  res.locals.user = user;
  res.locals.organization = organization;
  res.locals.token = token;
  next();
}

export function requireAdmin(
  _req: Request,
  res: Response<unknown, AuthedLocals>,
  next: NextFunction
) {
  if (res.locals.user.role !== "admin") {
    res.status(403).json({ error: "Admins only" });
    return;
  }
  next();
}
