import NextAuth from "next-auth";
import { authOptions } from "./options";

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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };