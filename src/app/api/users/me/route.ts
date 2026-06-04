
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2, "Il nome deve avere almeno 2 caratteri").optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    bio: z.string().optional(),
    phoneNumber: z.string().optional(),
    avatarUrl: z.string().optional().or(z.literal('')),
    themeColor: z.string().optional(),
    vacationDaysTotal: z.number().optional(),
});

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                jobTitle: true,
                department: true,
                bio: true,
                phoneNumber: true,
                vacationDaysTotal: true,
                vacationDaysUsed: true,
                personalHoursTotal: true,
                personalHoursUsed: true,
                themeColor: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}

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
                ...(validatedData.name !== undefined && { name: validatedData.name }),
                ...(validatedData.jobTitle !== undefined && { jobTitle: validatedData.jobTitle }),
                ...(validatedData.department !== undefined && { department: validatedData.department }),
                ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
                ...(validatedData.phoneNumber !== undefined && { phoneNumber: validatedData.phoneNumber }),
                ...(validatedData.avatarUrl !== undefined && { avatarUrl: validatedData.avatarUrl === '' ? null : validatedData.avatarUrl }),
                ...(validatedData.themeColor !== undefined && { themeColor: validatedData.themeColor }),
                ...(validatedData.vacationDaysTotal !== undefined && { vacationDaysTotal: validatedData.vacationDaysTotal }),
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.user.id))
            .returning({
                id: users.id,
                name: users.name,
                firstName: users.firstName,
                lastName: users.lastName,
                role: users.role,
                avatarUrl: users.avatarUrl,
                jobTitle: users.jobTitle,
                department: users.department,
                bio: users.bio,
                phoneNumber: users.phoneNumber,
                vacationDaysTotal: users.vacationDaysTotal,
                vacationDaysUsed: users.vacationDaysUsed,
                personalHoursTotal: users.personalHoursTotal,
                personalHoursUsed: users.personalHoursUsed,
                themeColor: users.themeColor,
            });

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
        }
        return NextResponse.json({ error: 'Errore interno del server' });
    }
}
