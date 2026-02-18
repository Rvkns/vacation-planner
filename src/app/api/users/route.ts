import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        // Get all users (excluding passwords)
        const allUsers = await db.query.users.findMany({
            columns: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                role: true,
                vacationDaysTotal: true,
                vacationDaysUsed: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Errore durante il recupero degli utenti' },
            { status: 500 }
        );
    }
}
