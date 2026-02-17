
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    bio: z.string().optional(),
    phoneNumber: z.string().optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
});

export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = updateProfileSchema.parse(body);

        const updatedUser = await db
            .update(users)
            .set({
                name: validatedData.name,
                jobTitle: validatedData.jobTitle,
                department: validatedData.department,
                bio: validatedData.bio,
                phoneNumber: validatedData.phoneNumber,
                avatarUrl: validatedData.avatarUrl || null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.user.id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                avatarUrl: users.avatarUrl,
                jobTitle: users.jobTitle,
                department: users.department,
                bio: users.bio,
                phoneNumber: users.phoneNumber,
            });

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}
