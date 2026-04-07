import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      is_admin?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    accessToken?: string;
    refreshToken?: string;
    is_admin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      is_admin?: boolean;
    };
  }
}
