import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'La password attuale è obbligatoria'),
    newPassword: z.string().min(8, 'La nuova password deve avere almeno 8 caratteri'),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return NextResponse.json({ error: 'La password attuale non è corretta' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.update(users)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(eq(users.id, session.user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0]?.message ?? 'Dati non validi' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}
