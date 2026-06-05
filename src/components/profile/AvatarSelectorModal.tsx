'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
    User, 
    Bot, 
    Sparkles, 
    Smile, 
    HelpCircle, 
    Dice5, 
    Check, 
    Search,
    UserCheck
} from 'lucide-react';

interface AvatarSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    currentAvatarUrl: string;
    userName: string;
}

interface AvatarStyle {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    presets: string[];
}

const AVATAR_STYLES: AvatarStyle[] = [
    {
        id: 'avataaars',
        name: 'Avataaars',
        icon: User,
        presets: ["Jack", "Milo", "Leo", "Buster", "Luna", "Lily", "Daisy", "Rocky", "Zoe", "Sam"]
    },
    {
        id: 'lorelei',
        name: 'Lorelei (Modern)',
        icon: Smile,
        presets: ["Maya", "Nova", "Sofia", "Cleo", "Zara", "Ruby", "Eva", "Aria", "Chloe", "Iris"]
    },
    {
        id: 'bottts',
        name: 'Bottts (Robot)',
        icon: Bot,
        presets: ["Oliver", "Gizmo", "Sparky", "Binary", "Pixel", "Widget", "Cyber", "Glitch", "Neon", "Rusty"]
    },
    {
        id: 'personas',
        name: 'Personas',
        icon: UserCheck,
        presets: ["Max", "Mia", "Leo", "Emma", "Alex", "Grace", "Liam", "Sophia", "Noah", "Olivia"]
    },
    {
        id: 'adventurer',
        name: 'Adventurer',
        icon: Sparkles,
        presets: ["Bear", "Shadow", "Hunter", "Ranger", "Scout", "Tracker", "Blaze", "Storm", "Frost", "Ash"]
    },
    {
        id: 'pixel-art',
        name: 'Pixel Art',
        icon: Sparkles,
        presets: ["Retro", "Arcade", "Pixel", "Mario", "Zelda", "Sonic", "Link", "Mega", "Pac", "Chrono"]
    },
    {
        id: 'fun-emoji',
        name: 'Emojis',
        icon: Smile,
        presets: ["Smile", "Wink", "Cool", "Love", "Happy", "Laugh", "Party", "Surprise", "Star", "Heart"]
    }
];

export default function AvatarSelectorModal({
    isOpen,
    onClose,
    onSelect,
    currentAvatarUrl,
    userName
}: AvatarSelectorModalProps) {
    const [selectedStyle, setSelectedStyle] = useState<string>('avataaars');
    const [customSeed, setCustomSeed] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [activeSeed, setActiveSeed] = useState<string>('');

    // Set initial preview based on currentAvatarUrl or fallback to user name seed
    useEffect(() => {
        if (isOpen) {
            if (currentAvatarUrl && currentAvatarUrl.startsWith('https://api.dicebear.com/7.x/')) {
                // Try to parse style and seed
                try {
                    const urlObj = new URL(currentAvatarUrl);
                    const styleMatch = urlObj.pathname.match(/\/7\.x\/([^/]+)\/svg/);
                    const seedParam = urlObj.searchParams.get('seed');
                    
                    if (styleMatch && styleMatch[1]) {
                        setSelectedStyle(styleMatch[1]);
                        if (seedParam) {
                            setCustomSeed(seedParam);
                            setActiveSeed(seedParam);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing current avatar URL:', e);
                }
                setPreviewUrl(currentAvatarUrl);
            } else {
                // Default to first style and user name seed
                const defaultSeed = userName || 'default';
                setSelectedStyle('avataaars');
                setCustomSeed(defaultSeed);
                setActiveSeed(defaultSeed);
                setPreviewUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(defaultSeed)}`);
            }
        }
    }, [isOpen, currentAvatarUrl, userName]);

    // Update preview URL when style or activeSeed changes
    const updatePreview = (style: string, seed: string) => {
        const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
        setPreviewUrl(url);
        setActiveSeed(seed);
    };

    const handleStyleChange = (styleId: string) => {
        setSelectedStyle(styleId);
        // Switch to the first preset of the new style
        const styleObj = AVATAR_STYLES.find(s => s.id === styleId);
        if (styleObj && styleObj.presets.length > 0) {
            const firstPreset = styleObj.presets[0];
            setCustomSeed('');
            updatePreview(styleId, firstPreset);
        }
    };

    const handlePresetSelect = (preset: string) => {
        setCustomSeed('');
        updatePreview(selectedStyle, preset);
    };

    const handleCustomSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomSeed(val);
        if (val.trim()) {
            updatePreview(selectedStyle, val.trim());
        }
    };

    const handleRandomize = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        setCustomSeed(randomString);
        updatePreview(selectedStyle, randomString);
    };

    const handleConfirm = () => {
        onSelect(previewUrl);
        onClose();
    };

    const activeStylePresets = AVATAR_STYLES.find(s => s.id === selectedStyle)?.presets || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scegli il tuo Avatar">
            <div className="space-y-6">
                {/* Preview and Generator Row */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-rose-500/20 bg-white dark:bg-gray-700 shadow-inner shrink-0 flex items-center justify-center">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Avatar Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <HelpCircle className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    
                    <div className="flex-1 w-full space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center sm:text-left">
                            Anteprima Live
                        </h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Scrivi un nome o parola..."
                                    value={customSeed}
                                    onChange={handleCustomSeedChange}
                                    className="pl-9 text-sm w-full"
                                />
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleRandomize}
                                title="Genera Casuale"
                                className="px-3 shrink-0"
                            >
                                <Dice5 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center sm:text-left">
                            Stile: <span className="font-semibold text-rose-500">{AVATAR_STYLES.find(s => s.id === selectedStyle)?.name}</span> • Seme: <span className="font-mono">{activeSeed}</span>
                        </p>
                    </div>
                </div>

                {/* Style Tabs */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Seleziona Stile
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                        {AVATAR_STYLES.map((style) => {
                            const Icon = style.icon;
                            const isSelected = selectedStyle === style.id;
                            return (
                                <button
                                    key={style.id}
                                    type="button"
                                    onClick={() => handleStyleChange(style.id)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border
                                        ${isSelected 
                                            ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/10' 
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                                        }
                                    `}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {style.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Icone Consigliate / Preset
                    </label>
                    <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                        {activeStylePresets.map((preset) => {
                            const presetUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(preset)}`;
                            const isSelected = activeSeed === preset && !customSeed;
                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handlePresetSelect(preset)}
                                    className={`
                                        relative aspect-square rounded-xl p-1 bg-white dark:bg-gray-900 border transition-all hover:scale-105 shadow-sm
                                        ${isSelected 
                                            ? 'border-rose-500 ring-2 ring-rose-500/20' 
                                            : 'border-gray-150 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                        }
                                    `}
                                    title={preset}
                                >
                                    <img
                                        src={presetUrl}
                                        alt={preset}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-md">
                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Annulla
                    </Button>
                    <Button type="button" onClick={handleConfirm} className="bg-rose-500 hover:bg-rose-600 text-white">
                        Conferma
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
