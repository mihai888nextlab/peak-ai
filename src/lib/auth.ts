import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import StravaProvider from 'next-auth/providers/strava';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, findUserById } from '@/lib/models/user';

export function getAuthOpts(): NextAuthOptions {
  return {
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async jwt({ token, user, trigger, session: sessionData, account, profile }) {
        if (user) {
          // For credentials login, user.id is already the MongoDB _id
          // For OAuth, we need to look up the user by email
          if (account?.provider === 'google' && profile?.email) {
            const dbUser = await findUserByEmail(profile.email.toLowerCase());
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.email = dbUser.email;
            } else {
              token.id = user.id;
              token.email = profile.email;
            }
          } else {
            token.id = user.id;
            token.email = (user as any).email;
          }
        }
        if (account?.provider === 'strava') {
          token.stravaAccessToken = account.access_token;
          token.stravaRefreshToken = account.refresh_token;
          token.stravaExpiresAt = account.expires_at;
        }
        if (trigger === 'update' && sessionData?.name) {
          token.name = sessionData.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          (session.user as any).stravaAccessToken = token.stravaAccessToken;
        }
        return session;
      },
    },
    events: {
      async signIn({ user, account, profile }) {
        console.log('=== SIGNIN EVENT ===');
        console.log('User:', user.email);
        console.log('Account provider:', account?.provider);
        
        if (account?.provider === 'google' && user.email) {
          const existingUser = await findUserByEmail(user.email.toLowerCase());
          if (!existingUser) {
            await createUser({
              email: user.email.toLowerCase(),
              name: user.name || 'Google User',
              googleId: account.providerAccountId,
              image: user.image || undefined,
            });
            console.log('User created in DB:', user.email);
          }
        }
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Invalid credentials');
          }

          const user = await findUserByEmail(credentials.email.toLowerCase());
          
          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
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
      ...(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET
        ? [
            StravaProvider({
              clientId: process.env.STRAVA_CLIENT_ID,
              clientSecret: process.env.STRAVA_CLIENT_SECRET,
            }),
          ]
        : []),
    ],
  };
}

export const authOptions: NextAuthOptions = getAuthOpts();
