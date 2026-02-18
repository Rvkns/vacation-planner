import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    firstName: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
    lastName: z.string().min(2, 'Il cognome deve essere di almeno 2 caratteri'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data di nascita non valida (formato YYYY-MM-DD)'),
    password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedFields = registerSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: 'Dati non validi', details: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { firstName, lastName, dateOfBirth, password } = validatedFields.data;

        // Check if user already exists (same firstName + lastName + dateOfBirth)
        const existingUser = await db.query.users.findFirst({
            where: and(
                eq(users.firstName, firstName),
                eq(users.lastName, lastName),
                eq(users.dateOfBirth, dateOfBirth),
            ),
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Esiste già un account con questi dati anagrafici' },
                { status: 400 }
            );
        }

        // Check if this is the first user (will be admin)
        const [userCount] = await db.select({ count: count() }).from(users);
        const isFirstUser = userCount.count === 0;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Compose display name
        const displayName = `${firstName} ${lastName}`;

        // Generate avatar URL
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

        // Create user
        const [newUser] = await db.insert(users).values({
            firstName,
            lastName,
            dateOfBirth,
            password: hashedPassword,
            name: displayName,
            role: isFirstUser ? 'ADMIN' : 'USER',
            vacationDaysTotal: 22,
            vacationDaysUsed: 0,
            avatarUrl,
        }).returning();

        // Return user without password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            {
                message: 'Utente registrato con successo',
                user: userWithoutPassword,
                isAdmin: isFirstUser,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Errore durante la registrazione' },
            { status: 500 }
        );
    }
}
