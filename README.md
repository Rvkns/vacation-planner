# VacaPlanner

Sistema di gestione ferie aziendale per team.

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ installato
- Account Vercel (per deployment)
- Database Neon PostgreSQL (gratuito via Vercel)

### Installazione Locale

1. **Clona il repository**
```bash
git clone https://github.com/Rvkns/vacation-planner.git
cd vacation-planner
```

2. **Installa dipendenze**
```bash
npm install
```

3. **Configura environment variables**

Crea il file `.env.local`:
```bash
DATABASE_URL=your_neon_database_url
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

Per generare `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

4. **Esegui le migrazioni database**
```bash
npm run db:push
```

5. **Avvia il server di sviluppo**
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## 📦 Deploy su Vercel

1. **Push su GitHub**
2. **Vai su [vercel.com](https://vercel.com/)**
3. **Importa il repository**
4. **Aggiungi Neon Database:**
   - Vai su "Storage" → "Create Database" → "Neon"
   - Vercel configurerà automaticamente `DATABASE_URL`
5. **Aggiungi Environment Variables:**
   - `NEXTAUTH_SECRET` (genera con `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (usa l'URL Vercel, es: `https://your-app.vercel.app`)
6. **Deploy!**

## ✨ Features

- ✅ Autenticazione utente (registrazione/login)
- ✅ Dashboard con calendario team
- ✅ Gestione richieste ferie
- ✅ Sistema di approvazione per manager
- ✅ Statistiche e analytics
- ✅ Design responsive moderno
- ✅ Database PostgreSQL persistente
- ✅ Gestione Password Sicura (password temporanee da amministratore con cambio password obbligatorio al primo accesso e modifica dal profilo)

## 👥 Ruoli Utente

- **ADMIN (Manager)**: Può approvare/rifiutare richieste del team
- **USER (Dipendente)**: Può creare richieste ferie personali

> **Nota**: Il primo utente registrato diventa automaticamente ADMIN.

## 🛠️ Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Autenticazione**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## 📁 Struttura Progetto

```
vacation-planner/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── db/              # Database schema & client
│   ├── services/        # API service layer
│   └── types/           # TypeScript types
├── drizzle/             # Database migrations
├── auth.ts              # NextAuth configuration
└── middleware.ts        # Route protection
```

## 📝 Scripts

```bash
npm run dev          # Avvia dev server
npm run build        # Build per produzione
npm run start        # Avvia prod server
npm run lint         # Lint codice
npm run db:push      # Aggiorna database schema
```

## 📄 License

MIT

## 👤 Author

Created by Rvkns
