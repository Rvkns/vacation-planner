
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProfileForm from '@/components/profile/ProfileForm';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                    Il Tuo Profilo
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Gestisci le tue informazioni personali e lavorative
                </p>
            </div>

            <ProfileForm user={user} />
        </div>
    );
}
