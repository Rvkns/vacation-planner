import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export default {
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const validatedFields = loginSchema.safeParse(credentials);

                if (!validatedFields.success) {
                    return null;
                }

                const { email, password } = validatedFields.data;

                // Find user by email
                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user || !user.password) {
                    return null;
                }

                // Verify password
                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                // Return user object (excluding password)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    vacationDaysTotal: user.vacationDaysTotal,
                    vacationDaysUsed: user.vacationDaysUsed,
                    avatarUrl: user.avatarUrl,
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.vacationDaysTotal = user.vacationDaysTotal;
                token.vacationDaysUsed = user.vacationDaysUsed;
                token.avatarUrl = user.avatarUrl;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'ADMIN' | 'USER';
                session.user.vacationDaysTotal = token.vacationDaysTotal as number;
                session.user.vacationDaysUsed = token.vacationDaysUsed as number;
                session.user.avatarUrl = token.avatarUrl as string | null;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
