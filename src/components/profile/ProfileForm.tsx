
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Save, User as UserIcon, Check, KeyRound, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { USER_COLORS } from '@/lib/colors';
import { changeUserPassword } from '@/lib/actions/auth';

interface ProfileFormProps {
    user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        bio: user.bio || '',
        phoneNumber: user.phoneNumber || '',
        vacationDaysTotal: user.vacationDaysTotal || 0,
        personalHoursTotal: user.personalHoursTotal || 0,
        themeColor: user.themeColor || '',
    });

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    // Sync state with user prop when it changes (e.g. after refresh)
    useEffect(() => {
        setFormData({
            name: user.name || '',
            avatarUrl: user.avatarUrl || '',
            jobTitle: user.jobTitle || '',
            department: user.department || '',
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            vacationDaysTotal: user.vacationDaysTotal || 0,
            personalHoursTotal: user.personalHoursTotal || 0,
            themeColor: user.themeColor || '',
        });
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            const updatedUser = await res.json();

            // Update session
            await update({
                ...updatedUser
            });

            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');

        if (newPassword.length < 6) {
            setPassError('La nuova password deve contenere almeno 6 caratteri');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPassError('Le password non coincidono');
            return;
        }

        setPassLoading(true);

        try {
            const res = await changeUserPassword(newPassword, currentPassword);
            if (!res.success) {
                setPassError(res.error || 'Errore durante il cambio della password');
            } else {
                setPassSuccess('Password aggiornata con successo!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch {
            setPassError('Si è verificato un errore durante l\'operazione');
        } finally {
            setPassLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('L\'immagine è troppo grande (max 2MB)');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatarUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Avatar & Security */}
            <div className="space-y-6">
                {/* Avatar Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Foto Profilo</CardTitle>
                        <CardDescription>Carica una foto o usa un avatar generato</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-gray-800 shadow-md">
                                <Image
                                    src={formData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name)}`}
                                    alt="Avatar Preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <Button variant="outline" className="relative w-full" type="button">
                                Carica Foto
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </Button>

                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-gray-900 px-2 text-gray-400">Opzioni avanzate</span>
                                </div>
                            </div>

                            <div className="w-full space-y-2">
                                <label className="text-xs font-medium text-gray-500">URL Immagine</label>
                                <Input
                                    value={formData.avatarUrl}
                                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Change Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <KeyRound className="w-5 h-5 text-[#EB0A1E]" />
                            Sicurezza Account
                        </CardTitle>
                        <CardDescription>Aggiorna la tua password di accesso</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {passError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                                    <span>{passError}</span>
                                </div>
                            )}
                            {passSuccess && (
                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-start gap-2">
                                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
                                    <span>{passSuccess}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password Corrente</label>
                                <Input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={passLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nuova Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Almeno 6 caratteri"
                                    disabled={passLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conferma Nuova Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ripeti la nuova password"
                                    disabled={passLoading}
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={passLoading} className="w-full bg-[#EB0A1E] hover:bg-[#CC091A] text-white">
                                    {passLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvataggio...
                                        </>
                                    ) : (
                                        'Aggiorna Password'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Details Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Dettagli Personali</CardTitle>
                    <CardDescription>Aggiorna le tue informazioni lavorative</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo</label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ruolo / Job Title</label>
                                <Input
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    placeholder="es. Frontend Developer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dipartimento</label>
                                <Input
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="es. Engineering"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Telefono</label>
                            <Input
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="+39 333..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bio</label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Breve descrizione di te..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div>
                                <label className="text-sm font-medium">Tema Profilo (Colore nel Calendario)</label>
                                <p className="text-xs text-gray-500 mb-3 mt-1">Scegli il colore con cui verrai visualizzato dagli altri utenti nel calendario e nelle richieste.</p>
                                <div className="flex flex-wrap gap-3">
                                    {USER_COLORS.map((color) => (
                                        <button
                                            key={color.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, themeColor: color.id })}
                                            className={`
                                                w-8 h-8 rounded-full flex items-center justify-center transition-all
                                                ${color.bg} ${formData.themeColor === color.id ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900 scale-110 shadow-lg' : 'hover:scale-110 shadow-sm opacity-90 hover:opacity-100'}
                                            `}
                                            title={color.id}
                                        >
                                            {formData.themeColor === color.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvataggio...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salva Modifiche
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
