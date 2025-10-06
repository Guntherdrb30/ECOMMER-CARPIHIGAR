import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (isValid) {
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role,
            alliedStatus: user.alliedStatus,
          } as any;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      // On initial sign-in, populate the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.alliedStatus = user.alliedStatus;
      }

      // On subsequent requests, check if the user still exists in the database
      // If not, invalidate the token by returning an empty object
      if (token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (!dbUser) {
          return {}; // Invalidate token by returning an empty object
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      // If the token is valid and has an ID, pass the user info to the session object
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).alliedStatus = token.alliedStatus;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
