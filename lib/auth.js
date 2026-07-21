// Konfigurasi NextAuth: login pakai email/password (Credentials) dan Google.
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail, createUser, verifyPassword } from "./serverStore";

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = findUserByEmail(credentials?.email);
        if (!user || !verifyPassword(user, credentials?.password)) return null;
        return {
          id: user.email,
          email: user.email,
          name: user.name,
          image: user.photo || null,
          role: user.role || "buyer",
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Kalau login pertama kali via Google, otomatis bikin akun buyer.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        const existing = findUserByEmail(user.email);
        if (!existing) {
          createUser({
            name: user.name || "Pengguna",
            email: user.email,
            role: "buyer",
            provider: "google",
            photo: user.image || "",
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // Baru login barusan.
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role || "buyer";
      }
      // Selalu sinkron data terbaru dari "database" (file user) biar
      // perubahan profil (nama/foto/hp/alamat) ikut ter-refresh di session.
      if (token?.email) {
        const dbUser = findUserByEmail(token.email);
        if (dbUser) {
          token.role = dbUser.role || "buyer";
          token.name = dbUser.name;
          token.picture = dbUser.photo || token.picture || null;
          token.phone = dbUser.phone || "";
          token.addresses = dbUser.addresses || [];
          token.selectedAddressId = dbUser.selectedAddressId || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role || "buyer";
        session.user.isAdmin = token.role === "admin";
        session.user.phone = token.phone || "";
        session.user.addresses = token.addresses || [];
        session.user.selectedAddressId = token.selectedAddressId || null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};