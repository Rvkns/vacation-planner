
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LeaveType, CreateLeaveRequest } from '@/types';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface RequestFormProps {
    initialDate?: string; // YYYY-MM-DD
    onSuccess: (data: CreateLeaveRequest) => Promise<void>;
    onCancel: () => void;
}

export default function RequestForm({ initialDate, onSuccess, onCancel }: RequestFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<CreateLeaveRequest & { handoverNotes?: string }>({
        startDate: format(initialDate || new Date(), 'yyyy-MM-dd'),
        endDate: format(initialDate || new Date(), 'yyyy-MM-dd'),
        startTime: undefined,
        endTime: undefined,
        type: 'VACATION',
        reason: '',
        handoverNotes: '',
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

            {formData.type !== 'VACATION' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ora Inizio
                        </label>
                        <Input
                            type="time"
                            value={formData.startTime || ''}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ora Fine
                        </label>
                        <Input
                            type="time"
                            value={formData.endTime || ''}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-4"> {/* Changed to space-y-4 for spacing between the two textareas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Motivazione (opzionale)
                    </label>
                    <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={2}
                        placeholder="Es. Viaggio di nozze, Visita medica..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Note per i colleghi (Handover) 📝
                    </label>
                    <textarea
                        value={formData.handoverNotes || ''}
                        onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                        className="w-full rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-amber-400 dark:placeholder:text-amber-700"
                        rows={3}
                        placeholder="Es. Le chiavi sono nel cassetto, ho delegato il ticket X a Marco..."
                    />
                </div>
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
