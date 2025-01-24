import { type AuthConfig } from "@auth/core"
import GitHub from "@auth/express/providers/github"
import Google from "@auth/express/providers/google"
import Credentials from "@auth/express/providers/credentials"

import { ENV } from "./env.config.js"

export const authConfig: AuthConfig = {
  trustHost: true,
  useSecureCookies: false,
  secret: ENV.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: ENV.AUTH_GITHUB_ID,
      clientSecret: ENV.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize({username, password}) {
        return null
      },
    }),
    //Google({
    //  clientId: ENV.AUTH_GOOGLE_ID,
    //  clientSecret: ENV.AUTH_GOOGLE_SECRET,
    //}),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accountType = account.type
      }
      return token
    }
  }
}