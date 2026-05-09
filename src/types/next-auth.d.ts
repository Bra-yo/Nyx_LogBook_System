import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      profile?: any
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    profile?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    profile?: any
  }
}
