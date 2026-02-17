
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LeaveType, CreateLeaveRequest } from '@/types';
import { Loader2 } from 'lucide-react';

interface RequestFormProps {
    initialDate?: string; // YYYY-MM-DD
    onSuccess: (data: CreateLeaveRequest) => Promise<void>;
    onCancel: () => void;
}

export default function RequestForm({ initialDate, onSuccess, onCancel }: RequestFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CreateLeaveRequest>({
        startDate: initialDate || '',
        endDate: initialDate || '',
        type: 'VACATION',
        reason: '',
    });

    useEffect(() => {
        if (initialDate) {
            setFormData(prev => ({
                ...prev,
                startDate: initialDate,
                endDate: initialDate
            }));
        }
    }, [initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSuccess(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dal
                    </label>
                    <Input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Al
                    </label>
                    <Input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo di Richiesta
                </label>
                <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })}
                >
                    <option value="VACATION">Ferie 🏖️</option>
                    <option value="SICK">Malattia 🤒</option>
                    <option value="PERSONAL">Permesso 🏠</option>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Motivazione (opzionale)
                </label>
                <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Inserisci note aggiuntive..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annulla
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Invio...
                        </>
                    ) : (
                        'Invia Richiesta'
                    )}
                </Button>
            </div>
        </form>
    );
}
