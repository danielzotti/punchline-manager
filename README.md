# Punchline Manager

* [English](#english)
* [Italiano](#italiano)

---

## English

Punchline Manager is a modern web application designed for storing, organizing, and tracking punchlines. It allows users to group punchlines by category and status, managing them through a responsive interface with automatic light and dark mode support.

### 🌟 Key Features

- **Punchline Management**: Add, edit, and view personal punchlines with rich text styling and automatic paste cleanup.
- **Collections Management**: Organize and structure punchlines into custom collections (e.g., setlists, shows). Insert custom narrative/context blocks ("Linked Text") between punchlines, reorder elements, and preview or export the collections to PDF.
- **Categories and Statuses**: Flexible organization through custom categories (creatable on-the-fly inside forms) and statuses (with drag-and-drop reordering).
- **Backup & Restore**: Easily export all application data (punchlines, collections, categories, and statuses) to a JSON file and restore it without losing existing data.
- **Authentication**: Secure integration with **Google OAuth** powered by Supabase.
- **Admin Dashboard**: Control access by managing authorized email addresses and assigning roles (admin vs. user).
- **Internationalization (i18n)**: Out-of-the-box multilingual support.
- **Premium & Responsive Design**: A modern, mobile-friendly interface with instant layout adjustments, reading controls (zoom in/out), and theme switching.

### 💻 Local Development

Locally, the application runs with:
- **Frontend (Next.js)** on [http://localhost:3008](http://localhost:3008).
- **Database and Backend services** managed locally using **Docker Supabase**.

#### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Docker](https://www.docker.com/) and Docker Compose
- [Supabase CLI](https://supabase.com/docs/guides/cli)

#### Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Supabase (Docker)**:
   Initialize and run local Supabase services:
   ```bash
   npx supabase start
   ```
   *Note: Ensure Docker Desktop or the Docker daemon is running on your machine. This command downloads and spins up Docker containers containing Postgres, Auth, Storage, Studio, etc.*

3. **Configure environment variables**:
   Create a `.env.local` file from `.env.example` using the credentials and URLs provided by the local Supabase start output:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3008](http://localhost:3008) in your browser to view the application.

#### 🚀 Production Deployment

The production build of the application is hosted and configured across the following services:

1. **Frontend**: Hosted on **Vercel**, linked directly to the GitHub repository for automated CI/CD deployments.
2. **Database & Auth**: Hosted on **Supabase Cloud**, providing secure production-grade PostgreSQL storage, scaling, and Google OAuth integration.

---

## Italiano

Punchline Manager è un'applicazione web moderna per la gestione, l'archiviazione e l'organizzazione di punchline. Consente agli utenti di organizzare le proprie punchline per categoria e stato, gestendole attraverso un'interfaccia responsive con supporto sia per il tema chiaro che scuro.

### 🌟 Funzionalità Principali

- **Gestione delle Punchline**: Aggiungi, modifica e visualizza punchline personali con formattazione del testo curata.
- **Gestione delle Raccolte**: Organizza e struttura le punchline in raccolte personalizzate (es. per spettacoli, scalette). Inserisci blocchi di testo di raccordo/collegamento ("Testo Collegato") tra le punchline, riordina gli elementi e visualizza un'anteprima o esporta la raccolta in PDF.
- **Categorie e Stati**: Organizzazione flessibile tramite categorie (creabili al volo nei form) e stati (con supporto al drag-and-drop).
- **Backup e Ripristino**: Esporta tutti i dati dell'applicazione (punchline, raccolte, categorie e stati) in un file JSON di backup e ripristinali facilmente senza perdere i dati esistenti.
- **Autenticazione**: Integrazione sicura con **Google OAuth** tramite Supabase.
- **Pannello di Amministrazione**: Gestione degli utenti autorizzati, dei loro ruoli (admin/user) e delle email consentite all'accesso.
- **Internazionalizzazione (i18n)**: Supporto multilingua integrato.
- **Design Curato & Responsive**: Layout moderno ottimizzato per dispositivi desktop e mobile con controlli di lettura (zoom in/out) e commutazione automatica del tema.

### 💻 Ambiente di Sviluppo Locale

L'applicazione in locale utilizza:
- **Frontend (Next.js)** su [http://localhost:3008](http://localhost:3008).
- **Database e Backend** gestiti localmente tramite **Docker Supabase**.

#### Prerequisiti
- [Node.js](https://nodejs.org/) (consigliato v20 o superiore)
- [Docker](https://www.docker.com/) e Docker Compose
- [Supabase CLI](https://supabase.com/docs/guides/cli)

#### Avvio in Locale

1. **Installazione delle dipendenze**:
   ```bash
   npm install
   ```

2. **Avvio di Supabase (Docker)**:
   Inizializza ed avvia i servizi locali di Supabase:
   ```bash
   npx supabase start
   ```
   *Nota: Assicurati che Docker sia attivo sul tuo computer. Questo comando avvierà i container Docker con Postgres, Auth, Storage, Studio, ecc.*

3. **Configurazione dell'ambiente**:
   Crea un file `.env.local` partendo da `.env.example` inserendo le credenziali e gli URL forniti dall'avvio locale di Supabase:
   ```bash
   cp .env.example .env.local
   ```

4. **Avvio del server di sviluppo Next.js**:
   ```bash
   npm run dev
   ```
   Apri [http://localhost:3008](http://localhost:3008) nel browser per interagire con l'applicazione.

#### 🚀 Hosting in Produzione

L'applicazione in produzione è configurata e ospitata sui seguenti servizi cloud:

1. **Frontend**: Hostato su **Vercel**, connesso al repository GitHub per il deployment continuo (CI/CD).
2. **Database & Auth**: Hostati su **Supabase Cloud**, garantendo alte prestazioni, sicurezza e gestione degli utenti integrata tramite PostgreSQL e Google OAuth.
