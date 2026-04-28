import { redirect } from 'next/navigation';
import { auth } from '@/../auth';
import { getAllUsers } from '@/lib/actions/admin';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export const metadata = {
    title: 'Gestione Utenti | Admin Dashboard',
    description: 'Gestisci utenti, ruoli e permessi',
};

export default async function AdminUsersPage() {
    const session = await auth();

    // Protezione rotta: solo ADMIN
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const result = await getAllUsers();

    if (!result.success || !result.data) {
        return (
            <div className="p-8 text-center text-destructive">
                <h1 className="text-2xl font-bold mb-4">Errore di caricamento</h1>
                <p>{result.error || 'Impossibile caricare gli utenti.'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestione Utenti</h1>
                <p className="text-muted-foreground mt-2">
                    Amministra gli account aziendali, resetta le password e aggiorna i permessi.
                </p>
            </div>

            <UserManagementTable initialUsers={result.data} />
        </div>
    );
}
