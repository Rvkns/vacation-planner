'use server';

import { auth } from '@/../auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/**
 * Consente a un utente autenticato di cambiare la propria password.
 * Se la password attuale è temporanea, non è richiesto l'inserimento della password corrente.
 * Se la password attuale è permanente, viene richiesto l'inserimento della password corrente per sicurezza.
 */
export async function changeUserPassword(newPassword: string, currentPassword?: string) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return { success: false, error: 'Non autorizzato. Effettua il login.' };
        }

        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'La nuova password deve essere di almeno 6 caratteri.' };
        }

        const userId = session.user.id;

        // Recupera l'utente corrente dal database
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return { success: false, error: 'Utente non trovato.' };
        }

        // Se la password NON è temporanea, richiedi la verifica della password corrente per motivi di sicurezza
        if (!user.isPasswordTemporary) {
            if (!currentPassword) {
                return { success: false, error: 'È necessaria la password corrente per autorizzare la modifica.' };
            }

            const currentPasswordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!currentPasswordMatch) {
                return { success: false, error: 'La password corrente non è corretta.' };
            }
        }

        // Hash della nuova password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Aggiorna la password nel database e imposta isPasswordTemporary a false
        await db.update(users)
            .set({ 
                password: hashedNewPassword,
                isPasswordTemporary: false,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        revalidatePath('/profile');
        revalidatePath('/');
        
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Si è verificato un errore durante il cambio password.' };
    }
}
