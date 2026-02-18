import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().min(1),
    password: z.string().min(1),
});

export default {
    providers: [
        Credentials({
            credentials: {
                firstName: { label: 'Nome', type: 'text' },
                lastName: { label: 'Cognome', type: 'text' },
                dateOfBirth: { label: 'Data di nascita', type: 'date' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const validatedFields = loginSchema.safeParse(credentials);

                if (!validatedFields.success) {
                    return null;
                }

                const { firstName, lastName, dateOfBirth, password } = validatedFields.data;

                // Find user by firstName + lastName + dateOfBirth
                const user = await db.query.users.findFirst({
                    where: and(
                        eq(users.firstName, firstName),
                        eq(users.lastName, lastName),
                        eq(users.dateOfBirth, dateOfBirth),
                    ),
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
                    email: '',   // no email in this system; NextAuth User type requires string
                    name: user.name,
                    firstName: user.firstName,
                    lastName: user.lastName,
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
                // Note: avatarUrl removed to prevent JWT size issues with Base64 images
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'ADMIN' | 'USER';
                session.user.vacationDaysTotal = token.vacationDaysTotal as number;
                session.user.vacationDaysUsed = token.vacationDaysUsed as number;
                // avatarUrl will be fetched from DB when needed
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
