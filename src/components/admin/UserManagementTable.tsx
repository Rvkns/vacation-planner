'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { resetUserPassword, updateUser } from '@/lib/actions/admin';
import { User } from '@/db/schema';
import { Search, KeyRound, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserManagementTableProps {
    initialUsers: Omit<User, 'password'>[];
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [editingUser, setEditingUser] = useState<Omit<User, 'password'> | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Password reset modal state
    const [resetPasswordUser, setResetPasswordUser] = useState<Omit<User, 'password'> | null>(null);
    const [newPassword, setNewPassword] = useState<string | null>(null);

    const filteredUsers = users.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleResetPassword = async () => {
        if (!resetPasswordUser) return;
        setIsLoading(true);
        setError(null);
        setNewPassword(null);
        
        try {
            const res = await resetUserPassword(resetPasswordUser.id);
            if (res.success && res.tempPassword) {
                setNewPassword(res.tempPassword);
            } else {
                setError(res.error || 'Errore durante il reset della password');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsLoading(true);
        setError(null);

        try {
            const res = await updateUser(editingUser.id, {
                role: editingUser.role,
                vacationDaysTotal: editingUser.vacationDaysTotal,
                personalHoursTotal: editingUser.personalHoursTotal,
                jobTitle: editingUser.jobTitle,
                department: editingUser.department,
            });

            if (res.success) {
                setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
                setIsEditModalOpen(false);
            } else {
                setError(res.error || 'Errore durante il salvataggio');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/5 rounded-t-xl pb-6">
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Directory Utenti
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Gestisci ruoli, permessi e accessi.</p>
                </div>
                <div className="w-72">
                    <Input
                        placeholder="Cerca per nome o ruolo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 border-y border-border">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Utente</th>
                                <th className="px-6 py-4 font-semibold">Ruolo</th>
                                <th className="px-6 py-4 font-semibold">Dipartimento</th>
                                <th className="px-6 py-4 font-semibold">Ferie Tot.</th>
                                <th className="px-6 py-4 font-semibold">Permessi Tot.</th>
                                <th className="px-6 py-4 font-semibold text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{user.firstName} {user.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'MANAGER' ? 'warning' : 'default'}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-muted-foreground">{user.department || '-'}</span>
                                        <div className="text-xs">{user.jobTitle}</div>
                                    </td>
                                    <td className="px-6 py-4">{user.vacationDaysTotal} gg</td>
                                    <td className="px-6 py-4">{user.personalHoursTotal} h</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    setResetPasswordUser(user);
                                                    setNewPassword(null);
                                                    setError(null);
                                                }}
                                                title="Resetta Password"
                                            >
                                                <KeyRound className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    setEditingUser({...user});
                                                    setIsEditModalOpen(true);
                                                    setError(null);
                                                }}
                                                title="Modifica Utente"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        Nessun utente trovato.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modale Reset Password */}
                <Modal 
                    isOpen={!!resetPasswordUser} 
                    onClose={() => !isLoading && setResetPasswordUser(null)} 
                    title="Reset Password"
                >
                    <div className="space-y-4 py-4">
                        {!newPassword ? (
                            <>
                                <p className="text-sm">
                                    Sei sicuro di voler resettare la password per <strong className="text-foreground">{resetPasswordUser?.firstName} {resetPasswordUser?.lastName}</strong>?
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Verrà generata una password temporanea.
                                </p>
                                {error && (
                                    <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setResetPasswordUser(null)} disabled={isLoading}>
                                        Annulla
                                    </Button>
                                    <Button onClick={handleResetPassword} disabled={isLoading}>
                                        {isLoading ? 'Reset in corso...' : 'Conferma Reset'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-semibold text-lg mb-1">Password Resettata!</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Comunica questa password temporanea all'utente.
                                    </p>
                                    <div className="bg-muted p-4 rounded-lg font-mono text-xl select-all border border-border">
                                        {newPassword}
                                    </div>
                                </div>
                                <Button className="w-full mt-4" onClick={() => setResetPasswordUser(null)}>
                                    Chiudi
                                </Button>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Modale Modifica Utente */}
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={() => !isLoading && setIsEditModalOpen(false)} 
                    title="Modifica Utente"
                >
                    {editingUser && (
                        <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ruolo</label>
                                    <Select
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                                    >
                                        <option value="USER">USER</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Dipartimento</label>
                                    <Input
                                        value={editingUser.department || ''}
                                        onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                                        placeholder="es. IT, HR, Design"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ferie Totali (Giorni)</label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={editingUser.vacationDaysTotal}
                                        onChange={(e) => setEditingUser({...editingUser, vacationDaysTotal: parseFloat(e.target.value)})}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Permessi Totali (Ore)</label>
                                    <Input
                                        type="number"
                                        value={editingUser.personalHoursTotal}
                                        onChange={(e) => setEditingUser({...editingUser, personalHoursTotal: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
                                    Annulla
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Modal>

            </CardContent>
        </Card>
    );
}
