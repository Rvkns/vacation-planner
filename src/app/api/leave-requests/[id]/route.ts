import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { leaveRequests, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const updateStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
});

// PATCH - Update leave request status (approve/reject)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id: requestId } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        // Only admins can approve/reject
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Solo i manager possono approvare/rifiutare richieste' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validatedFields = updateStatusSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: 'Dati non validi' },
                { status: 400 }
            );
        }

        const { status } = validatedFields.data;

        // Get the request first
        const request = await db.query.leaveRequests.findFirst({
            where: eq(leaveRequests.id, requestId),
        });

        if (!request) {
            return NextResponse.json(
                { error: 'Richiesta non trovata' },
                { status: 404 }
            );
        }

        // Update request status
        const [updatedRequest] = await db
            .update(leaveRequests)
            .set({
                status,
                reviewedBy: session.user.id,
                updatedAt: new Date(),
            })
            .where(eq(leaveRequests.id, requestId))
            .returning();

        // If approved, update user's vacation days
        if (status === 'APPROVED') {
            const start = new Date(request.startDate);
            const end = new Date(request.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            await db
                .update(users)
                .set({
                    vacationDaysUsed: sql`${users.vacationDaysUsed} + ${days}`,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, request.userId));
        }

        // Fetch complete request with user data
        const completeRequest = await db.query.leaveRequests.findFirst({
            where: eq(leaveRequests.id, requestId),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                reviewer: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(completeRequest);
    } catch (error) {
        console.error('Update leave request error:', error);
        return NextResponse.json(
            { error: 'Errore durante l\'aggiornamento della richiesta' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a leave request
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id: requestId } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }


        // Get the request first to verify ownership
        const request = await db.query.leaveRequests.findFirst({
            where: eq(leaveRequests.id, requestId),
        });

        if (!request) {
            return NextResponse.json(
                { error: 'Richiesta non trovata' },
                { status: 404 }
            );
        }

        // Only the owner can delete (and only if pending)
        if (request.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Non autorizzato a eliminare questa richiesta' },
                { status: 403 }
            );
        }

        if (request.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Solo le richieste in attesa possono essere eliminate' },
                { status: 400 }
            );
        }

        // Delete the request
        await db.delete(leaveRequests).where(eq(leaveRequests.id, requestId));

        return NextResponse.json({ message: 'Richiesta eliminata con successo' });
    } catch (error) {
        console.error('Delete leave request error:', error);
        return NextResponse.json(
            { error: 'Errore durante l\'eliminazione della richiesta' },
            { status: 500 }
        );
    }
}
