import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { AuthOptions } from "next-auth";
import { randomBytes } from "crypto";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      // On initial sign-in, populate the token
      if (user) {
        // If signing in with Google, ensure we have a local User record
        if (account?.provider === "google") {
          const email = (user as any)?.email as string | undefined;
          if (email) {
            let dbUser = await prisma.user.findUnique({ where: { email } });
            if (!dbUser) {
              const rawPassword = randomBytes(16).toString("hex");
              const hashed = await bcrypt.hash(rawPassword, 10);
              dbUser = await prisma.user.create({
                data: {
                  email,
                  name: (user as any)?.name || undefined,
                  password: hashed,
                  // role and alliedStatus use schema defaults
                },
              });
            }
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.alliedStatus = dbUser.alliedStatus;
          }
        } else {
          // Credentials provider path
          token.id = (user as any).id;
          token.role = (user as any).role;
          token.alliedStatus = (user as any).alliedStatus;
        }
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
