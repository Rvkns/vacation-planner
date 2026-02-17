
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarDays, CheckCircle2, Clock, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LeaveRequest, User } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import RequestForm from '@/components/requests/RequestForm';

export default function Dashboard() {
    const { data: session } = useSession();
    const currentUser = session?.user;
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

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

    // Componenti per le statistiche
    const stats = [
        {
            title: 'Ferie Disponibili',
            value: remainingDays,
            subtitle: `su ${totalDays} giorni`,
            icon: CalendarDays,
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400'
        },
        {
            title: 'Richieste Approvate',
            value: approvedRequests,
            subtitle: 'Mie richieste',
            icon: CheckCircle2,
            color: 'from-green-500 to-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
            text: 'text-green-600 dark:text-green-400'
        },
        {
            title: 'In Attesa',
            value: pendingRequests,
            subtitle: 'Richieste pending',
            icon: Clock,
            color: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400'
        },
        {
            title: 'Team',
            value: allUsers.length,
            subtitle: 'Membri del team',
            icon: Users,
            color: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400'
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const handleDayClick = (day: Date) => {
        // Prevent clicking on past days if desired, or allow it. 
        // For now, we allow clicking any day to request leave.
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
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Bentornato, <span className="font-semibold text-gray-800 dark:text-gray-200">{currentUser?.name}</span> 👋
                    </p>
                </div>
                <div className="hidden md:block text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
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
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.title} variants={item}>
                            <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-white dark:bg-gray-900">
                                <CardContent className="flex items-start justify-between p-8">
                                    <div className="space-y-4">
                                        <div className={`p-3 w-fit rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                                                {stat.title}
                                            </p>
                                            <h3 className="text-4xl font-bold mt-1 text-gray-900 dark:text-white">
                                                {stat.value}
                                            </h3>
                                            <p className={`text-sm mt-1 font-medium ${stat.text}`}>
                                                {stat.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Calendar Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-none shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
                    <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                Calendario Team
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Clicca su un giorno per inserire una nuova richiesta
                            </p>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 p-0 rounded-lg"
                            >
                                ←
                            </Button>
                            <span className="font-semibold w-40 text-center text-gray-700 dark:text-gray-200">
                                {format(currentMonth, 'MMMM yyyy', { locale: it })}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 w-8 h-8 p-0 rounded-lg"
                            >
                                →
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-7 gap-4 mb-6">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                                <div key={day} className="text-center font-semibold text-xs text-gray-400 uppercase tracking-widest">
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
                                                <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 dark:bg-gray-800/30 rounded-2xl" />
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

    return (
        <div
            onClick={onClick}
            className={`min-h-[120px] p-4 border rounded-3xl transition-all duration-200 cursor-pointer group relative overflow-hidden ${isToday
                ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:-translate-y-1'
                }`}>
            <div className={`text-right text-sm font-semibold mb-3 ${isToday ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                {format(day, 'd')}
            </div>
            <div className="space-y-2">
                {leaves.slice(0, 3).map((leave, i) => {
                    const user = allUsers.find((u) => u.id === leave.userId);
                    if (!user) return null;

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={leave.id}
                            className="flex items-center gap-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm"
                            title={user.name}
                        >
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200 dark:ring-gray-700 shrink-0">
                                <Image
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px]">
                                {user.name.split(' ')[0]}
                            </span>
                        </motion.div>
                    );
                })}
                {leaves.length > 3 && (
                    <div className="text-[10px] text-center font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-full py-1">
                        +{leaves.length - 3} altri
                    </div>
                )}
            </div>

            {/* Hover visual cue */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
