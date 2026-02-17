'use client';

import { useSession, signOut } from 'next-auth/react';
import { CalendarDays, FileText, Users, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

const navigation = [
    { name: 'Dashboard', href: '/', icon: CalendarDays },
    { name: 'Le mie richieste', href: '/my-requests', icon: FileText },
    { name: 'Richieste team', href: '/team-requests', icon: Users },
];

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!session?.user) return null;

    const currentUser = session.user;

    const sidebarContent = (
        <>
            {/* Logo & User Profile */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
                        <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            VacaPlanner
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Piano Ferie</p>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center gap-3">
                        <Image
                            src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                            alt={currentUser.name || 'User Avatar'}
                            width={40}
                            height={40}
                            className="rounded-full ring-2 ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {currentUser.email}
                            </p>
                        </div>
                    </div>
                    {currentUser.role === 'ADMIN' && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-semibold text-blue-600">Manager</span>
                        </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Ferie disponibili:</span>
                            <span className="font-semibold text-blue-600">
                                {currentUser.vacationDaysTotal - currentUser.vacationDaysUsed} giorni
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    // Hide "Richieste team" for non-admins
                    if (item.href === '/team-requests' && currentUser.role !== 'ADMIN') {
                        return null;
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Esci
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    'lg:hidden fixed top-0 left-0 z-40 w-80 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
