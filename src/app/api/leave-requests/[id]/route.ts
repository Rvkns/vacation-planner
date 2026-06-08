import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { leaveRequests, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { calculateWorkingDays } from '@/lib/dateUtils';


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

        // Only the owner can delete their own request, unless the caller is an ADMIN
        if (request.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Non autorizzato a eliminare questa richiesta' },
                { status: 403 }
            );
        }

        // Delete the request
        await db.delete(leaveRequests).where(eq(leaveRequests.id, requestId));

        // Restore user balance (reverse of what was deducted on creation)
        if (request.type === 'VACATION') {
            let days = calculateWorkingDays(request.startDate, request.endDate);

            // Refund only 0.5 if it was a half-day request
            if (request.startTime && request.endTime) {
                days = 0.5;
            }

            await db
                .update(users)
                .set({ vacationDaysUsed: sql`GREATEST(0, ${users.vacationDaysUsed} - ${days})`, updatedAt: new Date() })
                .where(eq(users.id, request.userId));
        } else {
            let hours = 0;
            if (request.startTime && request.endTime) {
                const [sh, sm] = request.startTime.split(':').map(Number);
                const [eh, em] = request.endTime.split(':').map(Number);
                hours = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
            } else {
                const days = calculateWorkingDays(request.startDate, request.endDate);
                hours = days * 8;
            }
            await db
                .update(users)
                .set({ personalHoursUsed: sql`GREATEST(0, ${users.personalHoursUsed} - ${Math.round(hours)})`, updatedAt: new Date() })
                .where(eq(users.id, request.userId));
        }

        return NextResponse.json({ message: 'Richiesta eliminata con successo' });
    } catch (error) {
        console.error('Delete leave request error:', error);
        return NextResponse.json(
            { error: 'Errore durante l\'eliminazione della richiesta' },
            { status: 500 }
        );
    }
}
