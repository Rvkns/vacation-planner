'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { KeyRound, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { changeUserPassword } from '@/lib/actions/auth';

export default function ChangePasswordForm() {
    const router = useRouter();
    const { update } = useSession();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (newPassword.length < 6) {
            setError('La password deve contenere almeno 6 caratteri');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Le password non coincidono');
            setIsLoading(false);
            return;
        }

        try {
            // Poiché la password è temporanea, non inviamo la password corrente
            const res = await changeUserPassword(newPassword);

            if (!res.success) {
                setError(res.error || 'Errore durante il cambio della password');
            } else {
                setSuccess(true);
                // Aggiorna la sessione per notificare che la password non è più temporanea
                await update({ isPasswordTemporary: false });
                
                // Reindirizza alla dashboard dopo un breve delay per mostrare il successo
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 1500);
            }
        } catch {
            setError('Si è verificato un errore di rete');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-red-50 dark:from-neutral-950 dark:via-black dark:to-neutral-900 p-4">
            <Card className="w-full max-w-md border-t-4 border-t-[#EB0A1E] shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-4">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Imposta Nuova Password</CardTitle>
                    <CardDescription>
                        Stai usando una password temporanea. Per motivi di sicurezza, devi sceglierne una nuova.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                            <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Password modificata!</h3>
                            <p className="text-sm text-neutral-500">Ti stiamo reindirizzando alla dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Nuova Password
                                </label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Almeno 6 caratteri"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Conferma Nuova Password
                                </label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ripeti la password"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-[#EB0A1E] hover:bg-[#CC091A] text-white flex items-center justify-center gap-2" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Salvataggio in corso...
                                    </>
                                ) : (
                                    'Aggiorna Password'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
