'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CalendarDays, Copy, CheckCircle } from 'lucide-react';

export default function RegisterForm() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registeredId, setRegisteredId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, dateOfBirth, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Errore durante la registrazione');
                setIsLoading(false);
                return;
            }

            // Show the unique ID to the user before redirecting
            setRegisteredId(data.user.id);
            setIsLoading(false);
        } catch {
            setError('Errore durante la registrazione');
            setIsLoading(false);
        }
    };

    const handleCopyId = () => {
        if (registeredId) {
            navigator.clipboard.writeText(registeredId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Success screen: show the unique ID
    if (registeredId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-red-50 dark:from-neutral-950 dark:via-black dark:to-neutral-900 p-4">
                <Card className="w-full max-w-md border-t-4 border-t-green-500 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Account creato!</CardTitle>
                        <CardDescription>Registrazione completata con successo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Il tuo ID univoco è:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs font-mono bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 break-all text-neutral-800 dark:text-neutral-200">
                                    {registeredId}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="shrink-0 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Copia ID"
                                >
                                    {copied
                                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                                        : <Copy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                    }
                                </button>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                Conserva questo ID per riferimento futuro. Per accedere usa Nome, Cognome e Data di nascita.
                            </p>
                        </div>
                        <Button className="w-full bg-[#EB0A1E] hover:bg-[#CC091A] text-white" onClick={() => router.push('/login')}>
                            Vai al Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-red-50 dark:from-neutral-950 dark:via-black dark:to-neutral-900 p-4">
            <Card className="w-full max-w-md border-t-4 border-t-[#EB0A1E] shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-xl bg-[#EB0A1E] flex items-center justify-center shadow-lg shadow-red-500/20 mb-4">
                        <CalendarDays className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Crea Account</CardTitle>
                    <CardDescription>Registra il tuo account su VacaPlanner</CardDescription>
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
                                placeholder="Minimo 6 caratteri"
                                required
                                disabled={isLoading}
                                minLength={6}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-[#EB0A1E] hover:bg-[#CC091A] text-white" disabled={isLoading}>
                            {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                        </Button>

                        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-4">
                            Hai già un account?{' '}
                            <Link href="/login" className="text-[#EB0A1E] hover:underline font-medium">
                                Accedi
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
