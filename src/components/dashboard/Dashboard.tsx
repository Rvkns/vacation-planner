
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarDays, CheckCircle2, Clock, Users, StickyNote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LeaveRequest, User } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { getHolidays, isHoliday } from '@/lib/holidays';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import RequestForm from '@/components/requests/RequestForm';
import { VacationStatsModal, RequestStatsModal, TeamManagementModal } from '@/components/dashboard/StatsModals';

export default function Dashboard() {
    const { data: session } = useSession();
    const currentUser = session?.user;
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeModal, setActiveModal] = useState<'VACATION' | 'REQUESTS' | 'TEAM' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [requestsRes, usersRes] = await Promise.all([
                    fetch('/api/leave-requests'),
                    fetch('/api/users')
                ]);

                if (requestsRes.ok) {
                    const data = await requestsRes.json();
                    setLeaveRequests(data);
                }

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setAllUsers(data);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        if (session) {
            fetchData();
        }
    }, [session]);

    if (!session?.user) return null;

    // Calculate stats
    const totalDays = currentUser?.vacationDaysTotal || 22;
    const usedDays = currentUser?.vacationDaysUsed || 0;
    const remainingDays = totalDays - usedDays;

    const myRequests = leaveRequests.filter(r => r.userId === currentUser?.id);
    const approvedRequests = myRequests.filter(r => r.status === 'APPROVED').length;
    const pendingRequests = myRequests.filter(r => r.status === 'PENDING').length;

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Componenti per le statistiche - Definition for mapping if needed, 
    // but we are using manual cards for click interaction now.
    const stats = [
        {
            title: 'Ferie Disponibili',
            value: remainingDays,
            subtitle: `su ${totalDays} giorni`,
            icon: CalendarDays,
            color: 'from-[#EB0A1E] to-[#CC091A]', // Toyota Red
            bg: 'bg-neutral-50 dark:bg-neutral-900',
            text: 'text-[#EB0A1E]'
        },
        {
            title: 'Richieste Approvate',
            value: approvedRequests,
            subtitle: 'Mie richieste',
            icon: CheckCircle2,
            color: 'from-green-500 to-green-600',
            bg: 'bg-green-50 dark:bg-green-900/10',
            text: 'text-green-600 dark:text-green-500'
        },
        {
            title: 'In Attesa',
            value: pendingRequests,
            subtitle: 'Richieste pending',
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            text: 'text-amber-600 dark:text-amber-500'
        },
        {
            title: 'Team',
            value: allUsers.length,
            subtitle: 'Membri del team',
            icon: Users,
            color: 'from-neutral-700 to-neutral-800', // Toyota Gray/Black
            bg: 'bg-neutral-50 dark:bg-neutral-900/10',
            text: 'text-neutral-700 dark:text-neutral-400'
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    const handleRequestSuccess = async (data: any) => {
        try {
            const res = await fetch('/api/leave-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const newRequest = await res.json();
                setLeaveRequests([newRequest, ...leaveRequests]);
                setIsModalOpen(false);
            } else {
                alert('Errore durante la creazione della richiesta');
            }
        } catch (error) {
            console.error('Error creating request:', error);
        }
    };

    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-lg text-neutral-500 dark:text-neutral-400">
                        Bentornato, <span className="font-semibold text-neutral-800 dark:text-neutral-200">{currentUser?.name}</span> 👋
                    </p>
                </div>
                <div className="hidden md:block text-sm font-medium text-neutral-500 bg-white dark:bg-neutral-900 px-6 py-3 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-800">
                    {format(new Date(), 'EEEE d MMMM yyyy', { locale: it })}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
                {/* 1. Vacation Stats */}
                <motion.div variants={item} onClick={() => setActiveModal('VACATION')} className="cursor-pointer">
                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-neutral-900 border-l-4 border-l-[#EB0A1E]">
                        <CardContent className="flex items-start justify-between p-8">
                            <div className="space-y-4">
                                <div className={`p-3 w-fit rounded-2xl bg-[#EB0A1E] shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <CalendarDays className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase">
                                        Ferie Disponibili
                                    </p>
                                    <h3 className="text-4xl font-bold mt-1 text-neutral-900 dark:text-white">
                                        {remainingDays}
                                    </h3>
                                    <p className="text-sm mt-1 font-medium text-[#EB0A1E]">
                                        su {totalDays} giorni
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 2. Requests Stats (Approved) */}
                <motion.div variants={item} onClick={() => setActiveModal('REQUESTS')} className="cursor-pointer">
                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-neutral-900 border-l-4 border-l-green-500">
                        <CardContent className="flex items-start justify-between p-8">
                            <div className="space-y-4">
                                <div className={`p-3 w-fit rounded-2xl bg-green-500 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase">
                                        Richieste Approvate
                                    </p>
                                    <h3 className="text-4xl font-bold mt-1 text-neutral-900 dark:text-white">
                                        {approvedRequests}
                                    </h3>
                                    <p className="text-sm mt-1 font-medium text-green-600 dark:text-green-500">
                                        Mie richieste
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 3. Pending Requests */}
                <motion.div variants={item} onClick={() => setActiveModal('REQUESTS')} className="cursor-pointer">
                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-neutral-900 border-l-4 border-l-amber-500">
                        <CardContent className="flex items-start justify-between p-8">
                            <div className="space-y-4">
                                <div className={`p-3 w-fit rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase">
                                        In Attesa
                                    </p>
                                    <h3 className="text-4xl font-bold mt-1 text-neutral-900 dark:text-white">
                                        {pendingRequests}
                                    </h3>
                                    <p className="text-sm mt-1 font-medium text-amber-600 dark:text-amber-500">
                                        Richieste pending
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 4. Team Management */}
                <motion.div variants={item} onClick={() => setActiveModal('TEAM')} className="cursor-pointer">
                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-white dark:bg-neutral-900 border-l-4 border-l-neutral-500">
                        <CardContent className="flex items-start justify-between p-8">
                            <div className="space-y-4">
                                <div className={`p-3 w-fit rounded-2xl bg-neutral-600 shadow-lg shadow-neutral-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase">
                                        Team
                                    </p>
                                    <h3 className="text-4xl font-bold mt-1 text-neutral-900 dark:text-white">
                                        {allUsers.length}
                                    </h3>
                                    <p className="text-sm mt-1 font-medium text-neutral-600 dark:text-neutral-400">
                                        Membri del team
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Calendar Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-none shadow-2xl overflow-hidden bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                <CalendarDays className="w-6 h-6 text-[#EB0A1E]" />
                                Calendario Team
                            </CardTitle>
                            <p className="text-sm text-neutral-500 mt-1">
                                Clicca su un giorno per inserire una nuova richiesta
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-neutral-800 p-1.5 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                className="hover:bg-neutral-100 dark:hover:bg-neutral-700 w-8 h-8 p-0 rounded-lg"
                            >
                                ←
                            </Button>
                            <span className="font-semibold w-40 text-center text-neutral-700 dark:text-neutral-200">
                                {format(currentMonth, 'MMMM yyyy', { locale: it })}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                className="hover:bg-neutral-100 dark:hover:bg-neutral-700 w-8 h-8 p-0 rounded-lg"
                            >
                                →
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex items-center gap-6 mb-6 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Ferie
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Malattia
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Permesso
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-4 mb-6">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                                <div key={day} className="text-center font-semibold text-xs text-neutral-400 uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-4">
                            {daysInMonth.map((day, dayIdx) => {
                                const dayLeaves = leaveRequests.filter(req =>
                                    req.status === 'APPROVED' &&
                                    (isSameDay(new Date(req.startDate), day) ||
                                        (new Date(req.startDate) <= day && new Date(req.endDate) >= day))
                                );

                                // Add empty placeholders for start of month
                                if (dayIdx === 0) {
                                    const startDay = day.getDay() || 7; // Convert Sunday (0) to 7
                                    const placeholders = Array(startDay - 1).fill(null);

                                    return (
                                        <>
                                            {placeholders.map((_, i) => (
                                                <div key={`empty-${i}`} className="min-h-[120px] bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl" />
                                            ))}
                                            <DayCell
                                                key={day.toString()}
                                                day={day}
                                                leaves={dayLeaves}
                                                allUsers={allUsers}
                                                onClick={() => handleDayClick(day)}
                                            />
                                        </>
                                    );
                                }

                                return (
                                    <DayCell
                                        key={day.toString()}
                                        day={day}
                                        leaves={dayLeaves}
                                        allUsers={allUsers}
                                        onClick={() => handleDayClick(day)}
                                    />
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats Modals */}
            <VacationStatsModal
                isOpen={activeModal === 'VACATION'}
                onClose={() => setActiveModal(null)}
                total={totalDays}
                used={usedDays}
            />

            <RequestStatsModal
                isOpen={activeModal === 'REQUESTS'}
                onClose={() => setActiveModal(null)}
                requests={myRequests}
            />

            <TeamManagementModal
                isOpen={activeModal === 'TEAM'}
                onClose={() => setActiveModal(null)}
                users={allUsers}
                currentUserRole={currentUser?.role}
            />

            {/* Request Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nuova Richiesta"
            >
                <RequestForm
                    initialDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
                    onSuccess={handleRequestSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

function DayCell({ day, leaves, allUsers, onClick }: { day: Date, leaves: LeaveRequest[], allUsers: User[], onClick: () => void }) {
    const isToday = isSameDay(day, new Date());
    const holidays = getHolidays(day.getFullYear());
    const holiday = isHoliday(day, holidays);

    return (
        <div
            onClick={onClick}
            className={`min-h-[120px] p-4 border rounded-3xl transition-all duration-200 cursor-pointer group relative overflow-hidden ${isToday
                ? 'bg-red-50/80 border-red-200 dark:bg-red-900/20 dark:border-red-800 ring-2 ring-[#EB0A1E] ring-offset-2 dark:ring-offset-neutral-900' // Toyota Red Highlight
                : holiday
                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                    : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-lg hover:-translate-y-1'
                }`}>
            <div className="flex justify-between items-start mb-3">
                <div className={`text-sm font-semibold ${isToday ? 'text-[#EB0A1E]' : holiday ? 'text-red-500' : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`}>
                    {format(day, 'd')}
                </div>
                {holiday && (
                    <span className="text-[10px] font-medium text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full truncate max-w-[80px]" title={holiday.localName}>
                        {holiday.localName}
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {leaves.slice(0, 3).map((leave, i) => {
                    const user = allUsers.find((u) => u.id === leave.userId);
                    if (!user) return null;

                    const typeColors = {
                        VACATION: 'ring-green-500 dark:ring-green-500',
                        SICK: 'ring-red-500 dark:ring-red-500',
                        PERSONAL: 'ring-amber-500 dark:ring-amber-500',
                    };
                    const ringColor = typeColors[leave.type as keyof typeof typeColors] || 'ring-gray-200 dark:ring-gray-700';
                    const hasNotes = leave.handoverNotes && leave.handoverNotes.trim().length > 0;

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={leave.id}
                            className="flex items-center gap-2 p-1.5 rounded-full bg-white/80 dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-700 shadow-sm relative group/item"
                            title={`${user.name} - ${leave.type}${hasNotes ? `\nNote: ${leave.handoverNotes}` : ''}`}
                        >
                            <div className={`w-5 h-5 rounded-full overflow-hidden bg-neutral-100 ring-2 ${ringColor} shrink-0`}>
                                <Image
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <span className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300 max-w-[80px]">
                                {user.name.split(' ')[0]}
                            </span>
                            {hasNotes && (
                                <div className="absolute -top-1 -right-1 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 p-0.5 rounded-full ring-1 ring-white dark:ring-neutral-900" title="Note presenti">
                                    <StickyNote className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {leaves.length > 3 && (
                    <div className="text-[10px] text-center font-medium text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-full py-1">
                        +{leaves.length - 3} altri
                    </div>
                )}
            </div>

            {/* Hover visual cue */}
            <div className="absolute inset-0 bg-[#EB0A1E]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
