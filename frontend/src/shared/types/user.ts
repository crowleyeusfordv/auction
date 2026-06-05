export interface BaseUser {
  id: string;
  name: string;
}

export interface Buyer extends BaseUser {
  role: "buyer";
}

export interface Seller extends BaseUser {
  role: "seller";
}

export type AppUser = Buyer | Seller;
export type UserRole = AppUser["role"];
