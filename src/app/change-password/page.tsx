import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

export const metadata = {
    title: 'Reimposta Password - VacaPlanner',
    description: 'Imposta una nuova password sicura per il tuo account.',
};

export default async function ChangePasswordPage() {
    const session = await auth();

    // Se non è loggato, vai alla login
    if (!session?.user) {
        redirect('/login');
    }

    // Se la password NON è temporanea, reindirizza alla home
    if (!session.user.isPasswordTemporary) {
        redirect('/');
    }

    return <ChangePasswordForm />;
}
