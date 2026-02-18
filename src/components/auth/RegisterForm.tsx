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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-gray-900 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-400 flex items-center justify-center shadow-lg mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Account creato!</CardTitle>
                        <CardDescription>Registrazione completata con successo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Il tuo ID univoco è:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 break-all text-gray-800 dark:text-gray-200">
                                    {registeredId}
                                </code>
                                <button
                                    onClick={handleCopyId}
                                    className="shrink-0 p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                                    title="Copia ID"
                                >
                                    {copied
                                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                                        : <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    }
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Conserva questo ID per riferimento futuro. Per accedere usa Nome, Cognome e Data di nascita.
                            </p>
                        </div>
                        <Button className="w-full" onClick={() => router.push('/login')}>
                            Vai al Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-black dark:to-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg mb-4">
                        <CalendarDays className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Crea Account</CardTitle>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                        </Button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                            Hai già un account?{' '}
                            <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                Accedi
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
