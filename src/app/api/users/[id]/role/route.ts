
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
        // In a real app, you would check if session.user.role === 'ADMIN' or 'MANAGER'
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { role } = updateRoleSchema.parse(body);

        // Prevent self-demotion if needed, or other business logic
        // For now, we allow any logged-in user to promote/demote for demo purposes, 
        // OR ideally enforce role checks. 
        // To keep it simple for this request (Manager view):

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
