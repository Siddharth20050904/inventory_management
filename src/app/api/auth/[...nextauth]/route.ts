import NextAuth from "next-auth";
import { authOptions } from "./options";

// Extend the Session type to include 'id' on user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

// For NextAuth 4.24.11


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };