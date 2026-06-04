'use client';

import { useState, useMemo } from 'react';
import { 
    BookOpen, 
    Calendar, 
    Clock, 
    Shield, 
    HelpCircle, 
    Search, 
    ChevronDown, 
    ChevronUp, 
    CheckCircle, 
    AlertCircle, 
    CalendarDays,
    ArrowRight,
    Sparkles,
    Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Wiki structure
interface WikiSection {
    id: string;
    title: string;
    description: string;
    icon: any;
    category: 'user' | 'manager' | 'faq';
    content: React.ReactNode;
}

export default function WikiPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<'all' | 'user' | 'manager' | 'faq'>('all');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    // Accordion handler for FAQs
    const toggleFaq = (id: string) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    // Define all sections and content
    const sections: WikiSection[] = useMemo(() => [
        {
            id: 'ferie',
            title: '🏖️ Come Funzionano le Ferie',
            description: 'Tutto sulla richiesta di ferie, mezze giornate ed esclusione delle festività.',
            icon: Calendar,
            category: 'user',
            content: (
                <div className="space-y-4 text-neutral-600 dark:text-neutral-300">
                    <p>
                        In VacaPlanner, la richiesta di ferie (Vacation) è progettata per essere semplice ed immediata. 
                        Le richieste di ferie vengono **auto-approvate istantaneamente** al momento dell'invio.
                    </p>
                    <div className="p-4 rounded-xl bg-[#EB0A1E]/5 border border-[#EB0A1E]/20 text-neutral-800 dark:text-neutral-200">
                        <h4 className="font-bold flex items-center gap-2 text-[#EB0A1E] mb-1">
                            <Sparkles className="w-4 h-4" /> 
                            Algoritmo Giorni Lavorativi Effettivi (Italia)
                        </h4>
                        <p className="text-sm">
                            Il nostro sistema integra un algoritmo avanzato di calendario italiano. Quando richiedi delle ferie, 
                            **il sistema esclude automaticamente dal conteggio**:
                        </p>
                        <ul className="list-disc list-inside mt-2 text-xs space-y-1 pl-2">
                            <li>I fine settimana (sabato e domenica).</li>
                            <li>Tutte le festività nazionali italiane statiche (Natale, Capodanno, Ferragosto, 25 Aprile, ecc.).</li>
                            <li>Le festività mobili calcolate dinamicamente (Pasqua e Lunedì dell'Angelo / Pasquetta).</li>
                        </ul>
                        <p className="text-xs mt-2 font-medium">
                            *Esempio: Richiedere ferie da giovedì a martedì a cavallo di Pasqua scalerà solo 3 giorni di ferie invece di 6!*
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Opzioni di Durata:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                <span className="font-bold text-xs uppercase tracking-wider text-neutral-400">Giornata Intera</span>
                                <p className="text-sm mt-1">Scala 1.0 giorno lavorativo per ciascun giorno selezionato.</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                <span className="font-bold text-xs uppercase tracking-wider text-[#EB0A1E]">Mezza Giornata (Mattina)</span>
                                <p className="text-sm mt-1">Scala esattamente 0.5 giorni (Orario predefinito: 09:00 - 13:00).</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                <span className="font-bold text-xs uppercase tracking-wider text-rose-500">Mezza Giornata (Pomeriggio)</span>
                                <p className="text-sm mt-1">Scala esattamente 0.5 giorni (Orario predefinito: 14:00 - 18:00).</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'permessi',
            title: '🏠 Permessi Personali ed Orari',
            description: 'Come richiedere permessi specificando gli orari e come vengono calcolate le ore.',
            icon: Clock,
            category: 'user',
            content: (
                <div className="space-y-4 text-neutral-600 dark:text-neutral-300">
                    <p>
                        I **Permessi Personali** (Personal Leave) ti consentono di assentarti per esigenze personali per alcune ore della giornata o per giorni interi.
                    </p>
                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">Due modalità di inserimento:</h4>
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        <li>
                            <strong className="text-neutral-900 dark:text-white">Permesso Orario:</strong> Specifica un orario di inizio e fine all'interno della stessa giornata (es. dalle 10:00 alle 12:00). Il sistema calcolerà esattamente le ore e le sottrarrà dal tuo saldo di <strong>Permessi Orari (iniziale di 32 ore)</strong>.
                        </li>
                        <li>
                            <strong className="text-neutral-900 dark:text-white">Permesso Giornaliero:</strong> Se non specifichi gli orari, il sistema considererà l'assenza per l'intera giornata. Verranno scalate **8 ore** per ciascun giorno lavorativo compreso nel periodo richiesto.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'outlook-handover',
            title: '📝 Note di Handover e Sync Outlook',
            description: 'L\'importanza del passaggio consegne e come sincronizzare i calendari.',
            icon: CalendarDays,
            category: 'user',
            content: (
                <div className="space-y-4 text-neutral-600 dark:text-neutral-300">
                    <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">📝 Note di Handover (Passaggio Consegne)</h4>
                        <p>
                            Quando crei una richiesta, puoi compilare il campo **Note per i colleghi (Handover)**. Questo campo è fondamentale per il lavoro di squadra: 
                            permette di inserire deleghe, collocazione di chiavi, stato dei ticket aperti o note urgenti. Sarà visibile a tutti i colleghi cliccando sul tuo nome nel calendario della Dashboard.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <h4 className="font-bold flex items-center gap-2 text-[#0078D4] mb-1">
                            <CalendarDays className="w-4 h-4" /> Sincronizzazione Outlook
                        </h4>
                        <p className="text-sm">
                            VacaPlanner include un'integrazione intelligente con **Outlook Calendar**. All'interno del modulo di richiesta, 
                            troverai un pulsante azzurro **"Pianifica in Outlook"**:
                        </p>
                        <p className="text-xs mt-1">
                            Cliccando su questo pulsante prima o dopo l'invio della richiesta, si aprirà una nuova scheda di Outlook Web precompilata con tutti i dettagli (giorni, ore, e titolo dell'assenza) per permetterti di salvare istantaneamente l'evento sul tuo calendario aziendale con un solo clic.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'gestione-team',
            title: '👥 Funzioni Manager e Approvazioni',
            description: 'La panoramica delle funzionalità dedicate a Manager e Amministratori.',
            icon: Shield,
            category: 'manager',
            content: (
                <div className="space-y-4 text-neutral-600 dark:text-neutral-300">
                    <p>
                        Gli utenti con ruolo **MANAGER** o **ADMIN** hanno accesso a visualizzazioni e controlli esclusivi per facilitare la coordinazione del team.
                    </p>
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <div className="p-2 rounded-lg bg-[#EB0A1E]/10 text-[#EB0A1E] mt-1">
                                <Shield className="w-4 h-4" />
                            </div>
                            <div>
                                <h5 className="font-semibold text-neutral-900 dark:text-white">Richieste Team</h5>
                                <p className="text-sm">Consente di monitorare in tempo reale tutte le richieste attive dei dipendenti, con filtri per stato (Approvato, In Attesa, Rifiutato) ed eliminazione/gestione in caso di pianificazioni errate.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mt-1">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h5 className="font-semibold text-neutral-900 dark:text-white">Gestione Utenti (Solo Admin)</h5>
                                <p className="text-sm">Disponibile nella barra laterale, permette di registrare nuovi utenti, modificare le informazioni personali, cambiare ruoli (User, Manager, Admin), reimpostare i saldi totali annuali di ore/giorni e generare password di reset temporanee in caso di smarrimento.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'faq-1',
            title: '❓ Cosa succede se inserisco una richiesta duplicata?',
            description: 'FAQ: Prevenzione di pianificazioni duplicate per lo stesso giorno.',
            icon: HelpCircle,
            category: 'faq',
            content: (
                <div className="text-neutral-600 dark:text-neutral-300">
                    <p>
                        VacaPlanner include un sistema di prevenzione dei duplicati. Se provi a richiedere ferie per una data o un periodo in cui hai **già una richiesta approvata o attiva**, 
                        il backend bloccherà l'inserimento mostrando il messaggio:
                    </p>
                    <p className="font-bold text-[#EB0A1E] my-2 text-center bg-[#EB0A1E]/5 p-2 rounded-lg border border-[#EB0A1E]/10">
                        "Hai già preso ferie per questo giorno"
                    </p>
                    <p className="text-sm">
                        Questo meccanismo impedisce di creare per errore richieste multiple e di scalare erroneamente il tuo saldo ferie più volte per la stessa data.
                    </p>
                </div>
            )
        },
        {
            id: 'faq-2',
            title: '❓ Come posso modificare una richiesta errata?',
            description: 'FAQ: Procedura per correggere date, orari o motivazioni.',
            icon: HelpCircle,
            category: 'faq',
            content: (
                <div className="text-neutral-600 dark:text-neutral-300 space-y-2">
                    <p>
                        Attualmente non è possibile modificare direttamente i dettagli di una richiesta già inviata. Tuttavia, la procedura corretta è semplicissima:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-2">
                        <li>Accedi alla sezione **"Le mie richieste"** dal menu laterale.</li>
                        <li>Trova la richiesta errata e clicca sul pulsante **Elimina (icona del cestino rosso)**.</li>
                        <li>Conferma l'eliminazione: **il sistema ti rimborserà immediatamente al 100% le ore o i giorni scalati** per quella richiesta.</li>
                        <li>Crea una nuova richiesta corretta direttamente dal calendario o da "Mie Richieste".</li>
                    </ol>
                </div>
            )
        },
        {
            id: 'faq-3',
            title: '❓ Come posso recuperare la mia password?',
            description: 'FAQ: Istruzioni per il reset delle credenziali.',
            icon: HelpCircle,
            category: 'faq',
            content: (
                <div className="text-neutral-600 dark:text-neutral-300 space-y-2">
                    <p>
                        Se sei loggato e vuoi semplicemente cambiare la tua password, puoi farlo visitando la pagina **"Profilo"** dal menu laterale.
                    </p>
                    <p>
                        Se hai smarrito le credenziali e non riesci più ad accedere:
                    </p>
                    <ul className="list-disc list-inside pl-2 text-sm">
                        <li>Contatta l'amministratore del sistema (Team Manager).</li>
                        <li>L'amministratore andrà nella sezione **Gestione Utenti**, selezionerà il tuo profilo e cliccherà su **"Reimposta Password"**.</li>
                        <li>Verrà generata una password temporanea sicura che ti verrà comunicata. Al primo accesso, ricordati di cambiarla visitando la pagina Profilo!</li>
                    </ul>
                </div>
            )
        }
    ], []);

    // Filter logic based on tab and query
    const filteredSections = useMemo(() => {
        return sections.filter(sec => {
            const matchesCategory = activeCategory === 'all' || sec.category === activeCategory;
            const matchesQuery = searchQuery === '' || 
                sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sec.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [sections, activeCategory, searchQuery]);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="relative p-8 rounded-3xl overflow-hidden glass border border-white/20 dark:border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#EB0A1E]/10 rounded-full blur-3xl -z-10" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EB0A1E]/10 text-[#EB0A1E] text-xs font-semibold uppercase tracking-wider">
                            <BookOpen className="w-3.5 h-3.5 animate-pulse" /> Wiki & Centro Assistenza
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                            Guida all'uso di VacaPlanner
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base max-w-2xl">
                            Trova risposte rapide a tutte le tue domande su come richiedere assenze, monitorare il tuo saldo di ferie e coordinare il tuo team aziendale.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Tabs Panel */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Cerca un argomento o una FAQ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/55 dark:bg-neutral-900/40 backdrop-blur-md text-sm outline-none focus:ring-2 focus:ring-[#EB0A1E] transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 dark:bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 self-start md:self-auto overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            activeCategory === 'all'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        Tutti
                    </button>
                    <button
                        onClick={() => setActiveCategory('user')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            activeCategory === 'user'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        Funzioni Utente
                    </button>
                    <button
                        onClick={() => setActiveCategory('manager')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            activeCategory === 'manager'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        Manager & Admin
                    </button>
                    <button
                        onClick={() => setActiveCategory('faq')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            activeCategory === 'faq'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        FAQ
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredSections.length > 0 ? (
                        filteredSections.map((sec, idx) => {
                            const Icon = sec.icon;
                            const isFaq = sec.category === 'faq';
                            const isExpanded = expandedFaq === sec.id;

                            if (isFaq) {
                                // FAQ Accordion style
                                return (
                                    <motion.div
                                        key={sec.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 overflow-hidden shadow-sm transition-all hover:border-neutral-200 dark:hover:border-neutral-700"
                                    >
                                        <button
                                            onClick={() => toggleFaq(sec.id)}
                                            className="w-full flex items-center justify-between p-5 text-left font-semibold text-neutral-900 dark:text-white bg-neutral-50/50 dark:bg-neutral-800/10 hover:bg-neutral-50 dark:hover:bg-neutral-800/35 transition-colors gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <HelpCircle className="w-5 h-5 text-[#EB0A1E] shrink-0" />
                                                <span>{sec.title}</span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-neutral-500" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-neutral-500" />
                                            )}
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/20 text-sm leading-relaxed">
                                                        {sec.content}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            }

                            // Regular detailed guide style
                            return (
                                <motion.div
                                    key={sec.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                                >
                                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-3 rounded-2xl bg-[#EB0A1E]/10 text-[#EB0A1E]">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                                    {sec.title}
                                                </h3>
                                                <p className="text-xs text-neutral-400 font-medium">
                                                    {sec.description}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            sec.category === 'manager' 
                                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                                                : 'bg-green-500/10 text-green-600 dark:text-green-400'
                                        }`}>
                                            {sec.category === 'manager' ? 'Admin & Manager' : 'Guida Generale'}
                                        </span>
                                    </div>
                                    <div className="text-sm leading-relaxed">
                                        {sec.content}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10"
                        >
                            <AlertCircle className="w-10 h-10 text-neutral-400 mb-3" />
                            <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-300">Nessun argomento trovato</h3>
                            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                                Non siamo riusciti a trovare guide o FAQ relative a "{searchQuery}". Prova ad utilizzare termini differenti.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
