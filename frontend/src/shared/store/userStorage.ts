import type { AppUser, UserRole } from "@/shared/types/user";
import type { Buyer } from "@/shared/types/user";
import type { Seller } from "@/shared/types/user";

const KEYS: Record<UserRole, string> = {
  buyer: "BUYER-DATA",
  seller: "SELLER-DATA",
};

function get(role: "buyer"): Buyer | null;
function get(role: "seller"): Seller | null;
function get(role: UserRole): AppUser | null;
function get(role: UserRole): AppUser | null {
  const raw = localStorage.getItem(KEYS[role]);
  return raw ? (JSON.parse(raw) as AppUser) : null;
}

function set(user: AppUser): void {
  localStorage.setItem(KEYS[user.role], JSON.stringify(user));
}

function clear(role: UserRole): void {
  localStorage.removeItem(KEYS[role]);
}

export const userStorage = { get, set, clear };
