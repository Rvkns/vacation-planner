'use client';

import { useSession, signOut } from 'next-auth/react';
import { CalendarDays, FileText, Users, LogOut, Menu, X, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navigation = [
    { name: 'Dashboard', href: '/', icon: CalendarDays },
    { name: 'Le mie richieste', href: '/my-requests', icon: FileText },
    { name: 'Richieste team', href: '/team-requests', icon: Users },
    { name: 'Profilo', href: '/profile', icon: UserIcon },
];

export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Fetch user avatar from API (not stored in JWT to avoid size issues)
    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/users/me')
                .then(res => res.json())
                .then(data => setAvatarUrl(data.avatarUrl))
                .catch(() => setAvatarUrl(null));
        }
    }, [session?.user?.id]);

    if (!session?.user) return null;

    const currentUser = session.user;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/80 backdrop-blur-md dark:bg-gray-900/80 shadow-sm border border-gray-200 dark:border-gray-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    'fixed lg:sticky top-0 left-0 z-40 w-72 h-screen glass border-r border-white/20 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo Section */}
                <div className="p-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                VacaPlanner
                            </h1>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Team Edition</p>
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="px-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center gap-4 relative">
                            <div className="relative">
                                <Image
                                    src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                                    alt={currentUser.name || 'User Avatar'}
                                    width={40}
                                    height={40}
                                    className="rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm"
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                                    {currentUser.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {currentUser.role === 'ADMIN' ? 'Team Manager' : 'Team Member'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
                            <span className="text-gray-500">Ferie residue</span>
                            <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                {currentUser.vacationDaysTotal - currentUser.vacationDaysUsed}gg
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2">
                    {navigation.map((item) => {
                        if (item.href === '/team-requests' && currentUser.role !== 'ADMIN') {
                            return null;
                        }

                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-500")} />
                                <span className="font-medium">{item.name}</span>
                                {isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/20 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tema</span>
                        <ThemeToggle />
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 gap-3"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Esci</span>
                    </Button>
                </div>
            </aside>
        </>
    );
}

