
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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Benvenuto, {currentUser?.name} 👋
                    </p>
                </div>
                <div className="text-sm text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                    {format(new Date(), 'EEEE d MMMM yyyy', { locale: it })}
                </div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.title} variants={item}>
                            <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {stat.title}
                                            </p>
                                            <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                                                {stat.value}
                                            </h3>
                                            <p className={`text-xs mt-1 font-medium ${stat.text}`}>
                                                {stat.subtitle}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-none shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-blue-500" />
                            Calendario Ferie Team
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                                className="hover:bg-white hover:text-blue-600 transition-colors"
                            >
                                ←
                            </Button>
                            <span className="font-semibold w-32 text-center py-1">
                                {format(currentMonth, 'MMMM yyyy', { locale: it })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                                className="hover:bg-white hover:text-blue-600 transition-colors"
                            >
                                →
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-7 gap-4 mb-4">
                            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                                <div key={day} className="text-center font-medium text-sm text-gray-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-4">
                            {daysInMonth.map((day, dayIdx) => {
                                const dayLeaves = leaveRequests.filter(req =>
                                    req.status === 'APPROVED' &&
                                    isSameDay(new Date(req.startDate), day) ||
                                    (new Date(req.startDate) <= day && new Date(req.endDate) >= day && req.status === 'APPROVED')
                                );

                                // Add empty placeholders for start of month
                                if (dayIdx === 0) {
                                    const startDay = day.getDay() || 7; // Convert Sunday (0) to 7
                                    const placeholders = Array(startDay - 1).fill(null);

                                    return (
                                        <>
                                            {placeholders.map((_, i) => (
                                                <div key={`empty-${i}`} className="h-24 bg-gray-50/30 dark:bg-gray-800/30 rounded-xl" />
                                            ))}
                                            <DayCell key={day.toString()} day={day} leaves={dayLeaves} allUsers={allUsers} />
                                        </>
                                    );
                                }

                                return <DayCell key={day.toString()} day={day} leaves={dayLeaves} allUsers={allUsers} />;
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

function DayCell({ day, leaves, allUsers }: { day: Date, leaves: LeaveRequest[], allUsers: User[] }) {
    const isToday = isSameDay(day, new Date());

    return (
        <div className={`min-h-[100px] p-3 border rounded-2xl transition-all duration-200 hover:shadow-md ${isToday
                ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 ring-1 ring-blue-400'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
            }`}>
            <div className={`text-right text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                {format(day, 'd')}
            </div>
            <div className="space-y-1.5">
                {leaves.slice(0, 2).map((leave, i) => {
                    const user = allUsers.find((u) => u.id === leave.userId);
                    if (!user) return null;

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={leave.id}
                            className="flex items-center gap-1.5 text-xs p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                            title={user.name}
                        >
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-white shrink-0">
                                <Image
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    width={16}
                                    height={16}
                                />
                            </div>
                            <span className="truncate font-medium">{user.name.split(' ')[0]}</span>
                        </motion.div>
                    );
                })}
                {leaves.length > 2 && (
                    <div className="text-[10px] text-center text-gray-400 font-medium">
                        +{leaves.length - 2} altri
                    </div>
                )}
            </div>
        </div>
    );
}
