import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Server-side calls need the internal Docker hostname, not localhost
const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.matcraft.ai/api/v1";

if (!process.env.NEXTAUTH_SECRET) {
  // eslint-disable-next-line no-console
  console.error(
    "[auth] NEXTAUTH_SECRET is not set. signIn() will fail at runtime.",
  );
}

async function postJson<T>(
  path: string,
  body: unknown,
  label: string,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[auth] ${label} failed`, res.status, text.slice(0, 300));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[auth] ${label} network error`, err);
    return null;
  }
}

type TokenPayload = {
  access_token: string;
  refresh_token: string;
  user_id?: string;
  email?: string;
  name?: string;
  phone_number?: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
};

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
        const data = await postJson<TokenPayload & { is_admin?: boolean }>(
          "/users/oauth/firebase",
          { id_token: credentials.idToken },
          "firebase oauth",
        );
        if (!data) return null;
        return {
          id: data.user_id || "unknown",
          email: data.email || data.phone_number || "",
          name: data.name || data.email || data.phone_number || "",
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          is_admin: data.is_admin || false,
        };
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
        const isGuest = credentials?.guest === "true";
        if (!isGuest && (!credentials?.email || !credentials?.password)) {
          return null;
        }

        const data = isGuest
          ? await postJson<TokenPayload>("/users/guest", {}, "guest login")
          : await postJson<TokenPayload>(
              "/users/login",
              { email: credentials!.email, password: credentials!.password },
              "credentials login",
            );
        if (!data) return null;

        let profile: Profile | null = null;
        try {
          const profileRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          if (profileRes.ok) profile = (await profileRes.json()) as Profile;
          else
            console.error(
              "[auth] /users/me failed after login",
              profileRes.status,
            );
        } catch (err) {
          console.error("[auth] /users/me network error", err);
        }

        return {
          id: profile?.id || "unknown",
          email: profile?.email || credentials?.email || "guest",
          name: profile?.full_name || credentials?.email || "Guest User",
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          is_admin: profile?.is_admin || false,
        };
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
        const data = await postJson<TokenPayload>(
          "/users/oauth/google",
          {
            email: user.email,
            name: user.name,
            google_id: account.providerAccountId,
          },
          "google oauth",
        );
        if (data) {
          token.accessToken = data.access_token;
          token.refreshToken = data.refresh_token;
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
