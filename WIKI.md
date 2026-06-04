# Wiki di VacaPlanner

Benvenuto nella Wiki di **VacaPlanner**, il sistema di gestione ferie e permessi aziendali. In questo documento trovi le informazioni sull'architettura del sistema, sulla gestione dei ruoli e sui flussi di sicurezza, inclusa la nuova gestione delle password temporanee.

---

## 👥 Ruoli Utente

Il sistema prevede tre ruoli principali definiti nell'enum `user_role` del database:

1. **ADMIN**: Ha visibilità completa. Può gestire gli account utente nella sezione *Gestione Utenti*, resettare le loro password fornendo credenziali temporanee e aggiornare i loro ruoli.
2. **MANAGER**: Responsabile del team. Può visualizzare e approvare o rifiutare le richieste di ferie/permessi dei membri del team.
3. **USER**: Dipendente standard. Può inserire le proprie richieste di ferie o permessi, monitorare i giorni residui e aggiornare i dettagli del proprio profilo.

---

## 🔒 Flusso di Gestione Password

Per garantire la massima sicurezza del sistema e dei dati personali, è stata introdotta una gestione robusta per il ripristino delle credenziali utente.

### 1. Generazione di una Password Temporanea (Admin)
Dalla dashboard di *Gestione Utenti* (`/admin/users`), un utente con ruolo **ADMIN** può richiedere il reset della password per un qualsiasi utente.
- Il sistema genera in modo sicuro una password casuale provvisoria che inizia con il prefisso `Temp-`.
- La password viene criptata utilizzando `bcrypt` (10 rounds di hashing) e memorizzata nel database.
- Contemporaneamente, il flag `is_password_temporary` dell'utente nel database viene impostato su `true`.
- L'amministratore visualizza la password in chiaro una sola volta per poterla comunicare al dipendente.

### 2. Primo Accesso e Cambio Password Obbligatorio (Utente)
Quando l'utente effettua il login inserendo le sue credenziali personali e la password temporanea ricevuta:
- Il server di autenticazione convalida le credenziali e avvia la sessione NextAuth, iniettando nel token JWT il flag `isPasswordTemporary: true`.
- Il **Middleware** intercepta qualsiasi richiesta successiva al login. Rilevando il flag attivo, reindirizza in modo forzato l'utente alla pagina `/change-password`.
- **Layout di Sicurezza:** Nella pagina `/change-password`, il layout principale dell'applicazione nasconde la barra laterale (`Sidebar`) e qualsiasi collegamento di navigazione. L'utente non può accedere a nessuna risorsa del portale finché non aggiorna la password.
- L'utente inserisce la nuova password desiderata (che deve essere di almeno 6 caratteri) e la conferma.
- All'invio del form, viene richiamata l'azione server sicura `changeUserPassword`. La password viene hashata, salvata sul database, e il flag `is_password_temporary` viene riportato a `false`.
- Il client aggiorna la sessione attiva e l'utente viene reindirizzato alla dashboard principale con la barra laterale nuovamente visibile.

### 3. Modifica Password dal Profilo
Un utente loggato può aggiornare la propria password in qualsiasi momento dalla sezione **Sicurezza Account** nella pagina del proprio profilo (`/profile`).
- **Misure di Sicurezza:** A differenza del flusso con password temporanea, per cambiare la password dal profilo l'utente **deve** fornire la sua *Password Corrente*.
- Il server verifica la corrispondenza con la password cifrata nel database prima di consentire la scrittura della nuova password, prevenendo modifiche non autorizzate in caso di sessioni lasciate sbloccate su dispositivi incustoditi.

---

## 💾 Struttura Tabella Database `users`

Di seguito l'elenco dei campi principali della tabella `users` interessati dalla sicurezza delle credenziali:

| Campo | Tipo | Descrizione |
| :--- | :--- | :--- |
| `id` | `uuid` | Identificativo univoco dell'utente (Chiave Primaria). |
| `password` | `varchar(255)` | Hash `bcrypt` della password dell'utente. |
| `is_password_temporary` | `boolean` | Flag di sicurezza. Se `true`, costringe l'utente a cambiare password. |
| `updated_at` | `timestamp` | Data dell'ultimo aggiornamento del profilo (incluso cambio password). |

---

## 🛠️ Tecnologie Utilizzate per la Sicurezza

- **NextAuth.js v5**: Gestione sicura delle sessioni tramite JWT criptati e firmati.
- **bcryptjs**: Algoritmo di hashing forte per la memorizzazione non reversibile delle password nel database.
- **Next.js Middleware**: Protezione delle rotte lato server prima del rendering della pagina per evitare bypass tramite URL.
