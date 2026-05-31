import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb-client";

type OAuthProviderId = "google" | "github";
type OAuthProvider = NextAuthOptions["providers"][number];

type OAuthProviderConfig = {
  id: OAuthProviderId;
  name: string;
  clientId?: string;
  clientSecret?: string;
  createProvider: (clientId: string, clientSecret: string) => OAuthProvider;
};

const oauthProviderConfigs: OAuthProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    createProvider: (clientId, clientSecret) =>
      GoogleProvider({
        clientId,
        clientSecret,
        allowDangerousEmailAccountLinking: true
      })
  },
  {
    id: "github",
    name: "GitHub",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    createProvider: (clientId, clientSecret) =>
      GitHubProvider({
        clientId,
        clientSecret,
        allowDangerousEmailAccountLinking: true
      })
  }
];

function hasOAuthCredentials(
  config: OAuthProviderConfig
): config is OAuthProviderConfig & { clientId: string; clientSecret: string } {
  return Boolean(config.clientId && config.clientSecret);
}

const enabledOAuthProviderConfigs = oauthProviderConfigs.filter(hasOAuthCredentials);

export const enabledOAuthProviders = enabledOAuthProviderConfigs.map(({ id, name }) => ({
  id,
  name
}));

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt"
  },
  providers: enabledOAuthProviderConfigs.map((config) =>
    config.createProvider(config.clientId, config.clientSecret)
  ),
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }

      return session;
    }
  }
};
