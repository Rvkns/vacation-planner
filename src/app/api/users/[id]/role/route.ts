
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateRoleSchema = z.object({
    role: z.enum(['USER', 'ADMIN', 'MANAGER']),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const callerRole = session.user.role;
        if (callerRole !== 'ADMIN' && callerRole !== 'MANAGER') {
            return NextResponse.json({ error: 'Accesso negato. Ruolo insufficiente.' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { role } = updateRoleSchema.parse(body);

        // Solo ADMIN può assegnare o revocare il ruolo ADMIN
        if (role === 'ADMIN' && callerRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Solo un amministratore può assegnare il ruolo ADMIN.' }, { status: 403 });
        }

        // Impedisce l'auto-declassamento dell'unico admin
        if (id === session.user.id && callerRole === 'ADMIN' && role !== 'ADMIN') {
            const adminCount = await db.select().from(users).where(eq(users.role, 'ADMIN'));
            if (adminCount.length <= 1) {
                return NextResponse.json({ error: 'Impossibile rimuovere l\'unico amministratore.' }, { status: 403 });
            }
        }

        await db
            .update(users)
            .set({ role })
            .where(eq(users.id, id));

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error('Error updating role:', error);
        return NextResponse.json(
            { error: 'Errore durante l\'aggiornamento del ruolo' },
            { status: 500 }
        );
    }
}
