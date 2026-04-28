'use server';

import { auth } from '@/../auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// Helper per verificare se l'utente loggato è ADMIN
async function verifyAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Non autorizzato. Solo gli amministratori possono eseguire questa azione.');
    }
    return session;
}

// Recupera tutti gli utenti
export async function getAllUsers() {
    await verifyAdmin();
    try {
        const allUsers = await db.query.users.findMany({
            orderBy: [desc(users.createdAt)],
            columns: {
                password: false, // Non esportiamo mai la password hashata
            }
        });
        return { success: true, data: allUsers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Genera una password temporanea e la imposta per un utente
export async function resetUserPassword(userId: string) {
    await verifyAdmin();
    try {
        // Genera una password sicura casuale (es. Temp-8xK2!)
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let tempPassword = "Temp-";
        for (let i = 0, n = charset.length; i < 8; ++i) {
            tempPassword += charset.charAt(Math.floor(Math.random() * n));
        }

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, userId));

        revalidatePath('/admin/users');
        return { success: true, tempPassword };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Aggiorna ruolo e altri campi utente
export async function updateUser(userId: string, data: Partial<typeof users.$inferInsert>) {
    await verifyAdmin();
    try {
        // Rimuovi campi non aggiornabili
        const { id, password, ...updateData } = data as any;
        
        await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId));

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
