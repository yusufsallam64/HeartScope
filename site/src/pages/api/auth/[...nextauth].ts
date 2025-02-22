import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth, { AuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { clientPromise } from "@/lib/db/client";
import { ObjectId } from "mongodb";
import { DatabaseService } from "@/lib/db/service";

if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET
) {
  throw new Error("Missing required environment variables");
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  pages: {
    signIn: "/auth/signup",
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const existingUser = await DatabaseService.getUserByEmail(
          user.email as string
        );
        const now = new Date();

        if (!existingUser) {
          const userDoc = {
            email: user.email,
            name: user.name,
            imageUrl: user.image,
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
          };

          const client = await clientPromise;
          const collection = client.db("DB").collection("users");
          await collection.insertOne({
            ...userDoc,
            _id: new ObjectId(),
          });
        } else {
          await DatabaseService.updateUserLastLogin(existingUser._id);
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    
    async session({ session, user }) {
      try {
        if (!session?.user?.email) {
          return session;
        }
        
        const dbUser = await DatabaseService.getUserByEmail(session.user.email);
        if (!dbUser) {
          return session;
        }
        
        return {
          ...session,
          user: {
            ...session.user,
            image: dbUser.imageUrl || session.user.image,
            email: dbUser.email,
            id: dbUser._id.toString(),
          }
        };
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/dashboard")) {
        return url;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return "/dashboard";
    },
  }
};

export default NextAuth(authOptions);
