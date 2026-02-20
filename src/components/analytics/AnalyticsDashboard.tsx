'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { LeaveRequest, User } from '@/types';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { leaveService } from '@/services/leaveService';
import Image from 'next/image';
import { BarChart3, List } from 'lucide-react';

const COLORS = {
    VACATION: '#EB0A1E', // Toyota Red
    SICK: '#f59e0b', // Amber
    PERSONAL: '#0ea5e9', // Sky
};

export default function AnalyticsDashboard() {
    const { data: session } = useSession();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [viewMode, setViewMode] = useState<'CHARTS' | 'SUMMARY'>('CHARTS');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [requestsRes, usersRes] = await Promise.all([
                    fetch('/api/leave-requests'),
                    fetch('/api/users')
                ]);

                if (requestsRes.ok) {
                    setLeaveRequests(await requestsRes.json());
                }
                if (usersRes.ok) {
                    setAllUsers(await usersRes.json());
                }
            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) fetchData();
    }, [session]);

    if (!session?.user) return null;
    if (isLoading) return <div className="p-12 text-center text-neutral-500">Caricamento in corso...</div>;

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            VACATION: 'Ferie',
            SICK: 'Malattia',
            PERSONAL: 'Permesso',
        };
        return labels[type] || type;
    };

    // --- Chart 1: Days taken by user (BarChart) ---
    const userStatsMap = new Map();
    allUsers.forEach(u => {
        userStatsMap.set(u.id, { name: u.name, VACATION: 0, SICK: 0, PERSONAL: 0 });
    });

    leaveRequests.forEach(req => {
        const userStat = userStatsMap.get(req.userId);
        if (userStat) {
            const days = leaveService.calculateDays(req);
            userStat[req.type] += days;
        }
    });

    // Filter out users with 0 leaves and sort
    const barChartData = Array.from(userStatsMap.values())
        .filter(s => s.VACATION > 0 || s.SICK > 0 || s.PERSONAL > 0)
        .sort((a, b) => (b.VACATION + b.SICK + b.PERSONAL) - (a.VACATION + a.SICK + a.PERSONAL));

    // --- Chart 2: Company Distribution (PieChart) ---
    const totalVacation = barChartData.reduce((sum, item) => sum + item.VACATION, 0);
    const totalSick = barChartData.reduce((sum, item) => sum + item.SICK, 0);
    const totalPersonal = barChartData.reduce((sum, item) => sum + item.PERSONAL, 0);

    const pieChartData = [
        { name: 'Ferie', value: totalVacation, color: COLORS.VACATION },
        { name: 'Malattia', value: totalSick, color: COLORS.SICK },
        { name: 'Permessi', value: totalPersonal, color: COLORS.PERSONAL },
    ].filter(d => d.value > 0);

    // --- Chart 3: Trend over time (LineChart) ---
    const monthMap = new Map();
    for (let i = 0; i < 12; i++) {
        monthMap.set(i, { name: format(new Date(2026, i, 1), 'MMM', { locale: it }), Ferie: 0, Malattia: 0, Permesso: 0 });
    }

    leaveRequests.forEach(req => {
        const date = new Date(req.startDate);
        // Let's only map current year for simplicity trend
        if (date.getFullYear() === new Date().getFullYear()) {
            const monthIdx = date.getMonth();
            const stat = monthMap.get(monthIdx);
            if (stat) {
                const days = leaveService.calculateDays(req);
                if (req.type === 'VACATION') stat.Ferie += days;
                if (req.type === 'SICK') stat.Malattia += days;
                if (req.type === 'PERSONAL') stat.Permesso += days;
            }
        }
    });
    const lineChartData = Array.from(monthMap.values());

    // --- Summary Mode: Upcoming Leaves ---
    const today = startOfDay(new Date());
    const upcomingLeaves = leaveRequests
        .filter(req => !isBefore(new Date(req.endDate), today)) // Keep future or currently active leaves
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());


    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
                        Analytics & Riepilogo
                    </h1>
                    <p className="text-lg text-neutral-500 dark:text-neutral-400">
                        Visualizza le statistiche del team o il riepilogo delle assenze programmate.
                    </p>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('CHARTS')}
                        className={`rounded-lg flex items-center gap-2 ${viewMode === 'CHARTS' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Grafici
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('SUMMARY')}
                        className={`rounded-lg flex items-center gap-2 ${viewMode === 'SUMMARY' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                    >
                        <List className="w-4 h-4" />
                        Summary
                    </Button>
                </div>
            </motion.div>

            {viewMode === 'CHARTS' ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid gap-8 lg:grid-cols-2"
                >
                    {/* User Distribution BarChart */}
                    <Card className="lg:col-span-2 border-none shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
                        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <CardTitle>Assenze per Dipendente</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(235, 10, 30, 0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="VACATION" name="Ferie" stackId="a" fill={COLORS.VACATION} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="SICK" name="Malattia" stackId="a" fill={COLORS.SICK} />
                                    <Bar dataKey="PERSONAL" name="Permessi" stackId="a" fill={COLORS.PERSONAL} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Overall Distribution PieChart */}
                    <Card className="border-none shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
                        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <CardTitle>Distribuzione Totale</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Trend LineChart */}
                    <Card className="border-none shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
                        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <CardTitle>Trend {new Date().getFullYear()}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Ferie" stroke={COLORS.VACATION} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Malattia" stroke={COLORS.SICK} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Card className="border-none shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
                        <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <CardTitle>Assenze Programmate (Da oggi in poi)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {upcomingLeaves.length === 0 ? (
                                <div className="p-12 text-center text-neutral-500">
                                    Nessuna assenza programmata futura.
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {upcomingLeaves.map(leave => {
                                        const user = allUsers.find(u => u.id === leave.userId);
                                        if (!user) return null;

                                        const days = leaveService.calculateDays(leave);
                                        const isHalfDay = leave.type === 'VACATION' && leave.startTime && leave.endTime;
                                        const isNow = isBefore(new Date(leave.startDate), new Date()) && isAfter(new Date(leave.endDate), new Date());

                                        return (
                                            <div key={leave.id} className="p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <Image
                                                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                                        alt={user.name}
                                                        width={48}
                                                        height={48}
                                                        className="rounded-full ring-2 ring-neutral-100 dark:ring-neutral-800 hidden sm:block"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-neutral-900 dark:text-white text-lg">{user.name}</h3>
                                                            {isNow && (
                                                                <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                    Ora Assente
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                            <span className="font-medium">
                                                                Dal {format(new Date(leave.startDate), 'dd MMM yyyy', { locale: it })} al {format(new Date(leave.endDate), 'dd MMM yyyy', { locale: it })}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${leave.type === 'VACATION' ? 'bg-[#EB0A1E]' : leave.type === 'SICK' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                                                                {getTypeLabel(leave.type)}
                                                            </span>
                                                            <span className="font-semibold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-neutral-700 dark:text-neutral-300">
                                                                {days} {days === 1 || days === 0.5 ? 'giorno' : 'giorni'}
                                                                {isHalfDay && ` (${leave.startTime === '09:00' ? 'Mattina' : 'Pomeriggio'})`}
                                                            </span>
                                                        </div>
                                                        {leave.handoverNotes && (
                                                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 italic">
                                                                "{leave.handoverNotes}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
