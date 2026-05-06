
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Save, User as UserIcon, Check, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { USER_COLORS } from '@/lib/colors';

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

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Le nuove password non coincidono');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch('/api/users/me/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setPasswordError(data.error || 'Errore durante il cambio password');
            } else {
                setPasswordSuccess(true);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch {
            setPasswordError('Errore di rete, riprova');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
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

            {/* Change Password Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5" />
                        Cambia Password
                    </CardTitle>
                    <CardDescription>Aggiorna la password del tuo account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {passwordSuccess && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                Password aggiornata con successo!
                            </div>
                        )}
                        {passwordError && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {passwordError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password Attuale</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    required
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                >
                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nuova Password</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    required
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="Min. 8 caratteri"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                >
                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Conferma Nuova Password</label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    required
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Ripeti la nuova password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Aggiornamento...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Aggiorna Password
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Details Section */}
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
