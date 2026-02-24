export type UserColor = {
    ring: string;
    bg: string;
    text: string;
    hex: string;
    id: string;
};

// We define at least 20 different colors for user customization
export const USER_COLORS: UserColor[] = [
    { id: 'sky', ring: 'ring-sky-500', bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', hex: '#0ea5e9' },
    { id: 'violet', ring: 'ring-violet-500', bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', hex: '#8b5cf6' },
    { id: 'orange', ring: 'ring-orange-500', bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', hex: '#f97316' },
    { id: 'emerald', ring: 'ring-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10b981' },
    { id: 'pink', ring: 'ring-pink-500', bg: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', hex: '#ec4899' },
    { id: 'amber', ring: 'ring-amber-500', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', hex: '#f59e0b' },
    { id: 'teal', ring: 'ring-teal-500', bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', hex: '#14b8a6' },
    { id: 'indigo', ring: 'ring-indigo-500', bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', hex: '#6366f1' },
    { id: 'rose', ring: 'ring-rose-500', bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', hex: '#f43f5e' },
    { id: 'fuchsia', ring: 'ring-fuchsia-500', bg: 'bg-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-400', hex: '#d946ef' },
    { id: 'purple', ring: 'ring-purple-500', bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', hex: '#a855f7' },
    { id: 'cyan', ring: 'ring-cyan-500', bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', hex: '#06b6d4' },
    { id: 'lime', ring: 'ring-lime-500', bg: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400', hex: '#84cc16' },
    { id: 'green', ring: 'ring-green-500', bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', hex: '#22c55e' },
    { id: 'yellow', ring: 'ring-yellow-500', bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', hex: '#eab308' },
    { id: 'red', ring: 'ring-red-500', bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', hex: '#ef4444' },
    { id: 'blue', ring: 'ring-blue-500', bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', hex: '#3b82f6' },
    { id: 'slate', ring: 'ring-slate-500', bg: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', hex: '#64748b' },
    { id: 'gray', ring: 'ring-gray-500', bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400', hex: '#6b7280' },
    { id: 'zinc', ring: 'ring-zinc-500', bg: 'bg-zinc-500', text: 'text-zinc-600 dark:text-zinc-400', hex: '#71717a' },
    { id: 'stone', ring: 'ring-stone-500', bg: 'bg-stone-500', text: 'text-stone-600 dark:text-stone-400', hex: '#78716c' },
    { id: 'toyota-red', ring: 'ring-[#EB0A1E]', bg: 'bg-[#EB0A1E]', text: 'text-[#EB0A1E]', hex: '#EB0A1E' },
];

export function getUserColor(userId: string, themeColor?: string | null, allUsersList: any[] = []): UserColor {
    // If the user has a custom theme color selected, use it
    if (themeColor) {
        const customColor = USER_COLORS.find(c => c.id === themeColor);
        if (customColor) return customColor;
    }

    // Fallback: deterministic color based on the user's index in the list, or just a default
    // We map the first 8 colors for the fallback to keep it similar to before
    const fallbackColors = USER_COLORS.slice(0, 8);

    let idx = allUsersList.findIndex(u => u.id === userId);
    return fallbackColors[Math.max(0, idx) % fallbackColors.length];
}
