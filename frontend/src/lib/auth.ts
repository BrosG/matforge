import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Server-side calls need the internal Docker hostname, not localhost
const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.matcraft.ai/api/v1";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;
        try {
          const res = await fetch(`${API_BASE}/users/oauth/firebase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: credentials.idToken }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user_id || "unknown",
            email: data.email || data.phone_number || "",
            name: data.name || data.email || data.phone_number || "",
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            is_admin: data.is_admin || false,
          };
        } catch {
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        guest: { label: "Guest", type: "text" },
      },
      async authorize(credentials) {
        try {
          let res: Response;

          if (credentials?.guest === "true") {
            res = await fetch(`${API_BASE}/users/guest`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
          } else {
            if (!credentials?.email || !credentials?.password) return null;
            res = await fetch(`${API_BASE}/users/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });
          }

          if (!res.ok) return null;

          const data = await res.json();

          const profileRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          const profile = profileRes.ok ? await profileRes.json() : null;

          return {
            id: profile?.id || "unknown",
            email: profile?.email || credentials?.email || "guest",
            name: profile?.full_name || credentials?.email || "Guest User",
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            is_admin: profile?.is_admin || false,
          };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 8 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = {
          id: user.id,
          email: user.email!,
          name: user.name,
          is_admin: user.is_admin,
        };
      }

      if (account?.provider === "google" && user) {
        try {
          const res = await fetch(`${API_BASE}/users/oauth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              google_id: account.providerAccountId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.refreshToken = data.refresh_token;
          }
        } catch {
          // Fall through with existing token
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },
  },
};
