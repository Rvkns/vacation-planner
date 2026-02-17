import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email('Email non valida'),
    password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
    name: z.string().min(2, 'Il nome deve essere di almeno 2 caratteri'),
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

        const { email, password, name } = validatedFields.data;

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email già registrata' },
                { status: 400 }
            );
        }

        // Check if this is the first user (will be admin)
        const [userCount] = await db.select({ count: count() }).from(users);
        const isFirstUser = userCount.count === 0;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate avatar URL
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

        // Create user
        const [newUser] = await db.insert(users).values({
            email,
            password: hashedPassword,
            name,
            role: isFirstUser ? 'ADMIN' : 'USER',
            vacationDaysTotal: 22,
            vacationDaysUsed: 0,
            avatarUrl,
        }).returning();

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

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
