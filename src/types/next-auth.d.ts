
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: 'ADMIN' | 'USER' | 'MANAGER';
            vacationDaysTotal: number;
            vacationDaysUsed: number;
            // avatarUrl removed - fetch from DB when needed to avoid JWT size issues
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: 'ADMIN' | 'USER' | 'MANAGER';
        vacationDaysTotal: number;
        vacationDaysUsed: number;
        avatarUrl: string | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: 'ADMIN' | 'USER' | 'MANAGER';
        vacationDaysTotal: number;
        vacationDaysUsed: number;
        // avatarUrl removed - fetch from DB when needed to avoid JWT size issues
    }
}
