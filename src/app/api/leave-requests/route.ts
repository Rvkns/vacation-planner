import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createLeaveRequestSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    type: z.enum(['VACATION', 'SICK', 'PERSONAL']),
    reason: z.string().optional(),
    handoverNotes: z.string().optional(),
});

// GET - Fetch leave requests
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        const query = db.query.leaveRequests.findMany({
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        vacationDaysTotal: true,
                        vacationDaysUsed: true,
                    },
                },
                reviewer: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: (leaveRequests, { desc }) => [desc(leaveRequests.createdAt)],
        });

        let requests = await query;

        // Filter by userId if provided
        if (userId) {
            requests = requests.filter(r => r.userId === userId);
        }

        // Filter by status if provided
        if (status) {
            requests = requests.filter(r => r.status === status);
        }

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Get leave requests error:', error);
        return NextResponse.json(
            { error: 'Errore durante il recupero delle richieste' },
            { status: 500 }
        );
    }
}

// POST - Create new leave request
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const body = await req.json();
        const validatedFields = createLeaveRequestSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: 'Dati non validi', details: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { startDate, endDate, type, reason } = validatedFields.data;

        // Create leave request
        const [newRequest] = await db.insert(leaveRequests).values({
            userId: session.user.id,
            startDate,
            endDate,
            type,
            reason,
            handoverNotes: validatedFields.data.handoverNotes,
            status: 'PENDING',
        }).returning();

        // Fetch complete request with user data
        const completeRequest = await db.query.leaveRequests.findFirst({
            where: eq(leaveRequests.id, newRequest.id),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return NextResponse.json(completeRequest, { status: 201 });
    } catch (error) {
        console.error('Create leave request error:', error);
        return NextResponse.json(
            { error: 'Errore durante la creazione della richiesta' },
            { status: 500 }
        );
    }
}
