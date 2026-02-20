
'use client';

import Modal from '@/components/ui/Modal';
import { LeaveRequest, User } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import Image from 'next/image';
import { Shield, ShieldAlert, ShieldCheck, Pencil, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Vacation Stats Modal ---
interface VacationStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    used: number;
    onUpdate?: () => void;
}

export function VacationStatsModal({ isOpen, onClose, total, used, onUpdate }: VacationStatsModalProps) {
    const remaining = total - used;
    const [isEditing, setIsEditing] = useState(false);
    const [newRemaining, setNewRemaining] = useState(remaining.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        const remainingVal = parseFloat(newRemaining);
        if (isNaN(remainingVal) || remainingVal < 0) {
            alert("Inserisci un numero valido maggiore o uguale a 0");
            return;
        }

        setIsSaving(true);
        try {
            const newTotal = remainingVal + used;
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vacationDaysTotal: newTotal })
            });

            if (res.ok) {
                setIsEditing(false);
                if (onUpdate) onUpdate();
            } else {
                alert("Errore durante l'aggiornamento.");
            }
        } catch (error) {
            console.error(error);
            alert("Errore di connessione");
        } finally {
            setIsSaving(false);
        }
    };

    const data = [
        { name: 'Usate', value: used, color: '#a3a3a3' }, // neutral-400
        { name: 'Rimanenti', value: remaining, color: '#EB0A1E' }, // Toyota Red
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Dettaglio Ferie">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 space-y-4">
                <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Hai usato <span className="font-bold text-neutral-500">{used}</span> giorni su <span className="font-bold">{total}</span>.
                </p>

                {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-neutral-500">Ti rimangono:</span>
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={newRemaining}
                            onChange={(e) => setNewRemaining(e.target.value)}
                            className="w-20 px-2 py-1 text-center border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-[#EB0A1E] focus:border-[#EB0A1E] dark:bg-neutral-800"
                        />
                        <span className="text-sm text-neutral-500">giorni</span>
                        <div className="flex gap-1 ml-2">
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Ti rimangono <span className="text-[#EB0A1E] font-bold">{remaining}</span> giorni da pianificare! 🌴
                        </p>
                        <button
                            onClick={() => {
                                setNewRemaining(remaining.toString());
                                setIsEditing(true);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Modifica giorni rimanenti"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}


// --- Team Management Modal ---
interface TeamManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUserRole?: string;
}

export function TeamManagementModal({ isOpen, onClose, users, currentUserRole }: TeamManagementModalProps) {
    const router = useRouter();
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // Filter out current user from the list if desired, or show everyone.
    // For now showing everyone.

    const handleRoleUpdate = async (userId: string, newRole: 'USER' | 'MANAGER' | 'ADMIN') => {
        if (!confirm(`Sei sicuro di voler cambiare il ruolo in ${newRole}?`)) return;

        setUpdatingUserId(userId);
        try {
            const res = await fetch(`/api/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                router.refresh(); // Refresh to update user list in parent
            } else {
                alert('Errore durante l\'aggiornamento del ruolo');
            }
        } catch (error) {
            console.error(error);
            alert('Errore di connessione');
        } finally {
            setUpdatingUserId(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestione Team">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shrink-0 ring-2 ring-neutral-100 dark:ring-neutral-700">
                                <Image
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    width={40}
                                    height={40}
                                />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900 dark:text-white leading-tight">
                                    {user.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {user.role === 'ADMIN' && <ShieldAlert className="w-3 h-3 text-[#EB0A1E]" />}
                                    {user.role === 'MANAGER' && <ShieldCheck className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />}
                                    {user.role === 'USER' && <Shield className="w-3 h-3 text-neutral-400" />}
                                    <span className="text-xs text-neutral-500 font-medium lowercase first-letter:uppercase">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions - Only visible if current user is Manager/Admin (logic can be stricter) */}
                        <div className="flex gap-2">
                            {user.role === 'USER' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 text-neutral-900 hover:text-white border-neutral-200 hover:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                    onClick={() => handleRoleUpdate(user.id, 'MANAGER')}
                                    disabled={updatingUserId === user.id}
                                >
                                    Promuovi
                                </Button>
                            )}
                            {user.role === 'MANAGER' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 text-[#EB0A1E] hover:text-white border-red-200 hover:bg-[#EB0A1E] dark:hover:bg-[#EB0A1E]/80"
                                    onClick={() => handleRoleUpdate(user.id, 'USER')}
                                    disabled={updatingUserId === user.id}
                                >
                                    Degrada
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
                Solo i Manager possono modificare i ruoli.
            </div>
        </Modal>
    );
}
