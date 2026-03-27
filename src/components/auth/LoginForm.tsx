'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CalendarDays } from 'lucide-react';

export default function LoginForm() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                firstName,
                lastName,
                dateOfBirth,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Dati non validi o password errata');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError('Errore durante il login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-red-50 dark:from-neutral-950 dark:via-black dark:to-neutral-900 p-4">
            <Card className="w-full max-w-md border-t-4 border-t-[#EB0A1E] shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-xl bg-[#EB0A1E] flex items-center justify-center shadow-lg shadow-red-500/20 mb-4">
                        <CalendarDays className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Benvenuto in VacaPlanner</CardTitle>
                    <CardDescription>Accedi al tuo account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Nome
                                </label>
                                <Input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Mario"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Cognome
                                </label>
                                <Input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Rossi"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Data di nascita
                            </label>
                            <Input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Password
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-[#EB0A1E] hover:bg-[#CC091A] text-white" disabled={isLoading}>
                            {isLoading ? 'Accesso in corso...' : 'Accedi'}
                        </Button>

                        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-4">
                            Non hai un account?{' '}
                            <Link href="/register" className="text-[#EB0A1E] hover:underline font-medium">
                                Registrati
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
