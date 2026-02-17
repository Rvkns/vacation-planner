'use client';

import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/leaveService';
import { userService } from '@/services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CalendarDays, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { LeaveRequest } from '@/types';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                const [requests, users] = await Promise.all([
                    leaveService.getAllRequests(),
                    userService.getAllUsers(),
                ]);
                setLeaveRequests(requests);
                setAllUsers(users);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [currentUser]);

    if (!currentUser) return null;

    const approvedRequests = leaveRequests.filter(r => r.status === 'APPROVED');
    const pendingRequests = leaveRequests.filter(r => r.status === 'PENDING');
    const myRequests = leaveService.getRequestsByUserId(currentUser.id);
    const myApprovedCount = myRequests.filter(r => r.status === 'APPROVED').length;

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getDayLeaves = (date: Date) => {
        return approvedRequests.filter(req => {
            const start = parseISO(req.startDate);
            const end = parseISO(req.endDate);
            return date >= start && date <= end;
        });
    };

    const stats = [
        {
            title: 'Ferie Disponibili',
            value: `${currentUser.vacationDaysTotal - currentUser.vacationDaysUsed}`,
            subtitle: `su ${currentUser.vacationDaysTotal} giorni`,
            icon: CalendarDays,
            color: 'from-blue-600 to-blue-400',
        },
        {
            title: 'Richieste Approvate',
            value: myApprovedCount.toString(),
            subtitle: 'Mie richieste',
            icon: CheckCircle2,
            color: 'from-green-600 to-green-400',
        },
        {
            title: 'In Attesa',
            value: pendingRequests.length.toString(),
            subtitle: 'Richieste pending',
            icon: Clock,
            color: 'from-yellow-600 to-yellow-400',
        },
        {
            title: 'Team',
            value: userService.getAllUsers().length.toString(),
            subtitle: 'Membri del team',
            icon: Users,
            color: 'from-purple-600 to-purple-400',
        },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Panoramica delle ferie del team
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {stat.subtitle}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Calendario Ferie Team</CardTitle>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                ←
                            </button>
                            <span className="text-sm font-medium min-w-[150px] text-center">
                                {format(currentMonth, 'MMMM yyyy', { locale: it })}
                            </span>
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                →
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {/* Day headers */}
                        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                            <div key={day} className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 p-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for offset */}
                        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {/* Day cells */}
                        {daysInMonth.map(day => {
                            const dayLeaves = getDayLeaves(day);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`min-h-[80px] p-2 rounded-lg border-2 transition-all ${isToday
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                        }`}
                                >
                                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayLeaves.slice(0, 2).map(leave => {
                                            const user = userService.getUserById(leave.userId);
                                            return (
                                                <div
                                                    key={leave.id}
                                                    className="text-xs px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-500 to-blue-400 text-white truncate"
                                                    title={user?.name}
                                                >
                                                    {user?.name.split(' ')[0]}
                                                </div>
                                            );
                                        })}
                                        {dayLeaves.length > 2 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                +{dayLeaves.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
