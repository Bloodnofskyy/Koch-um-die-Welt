# Koch dich um die Welt

React/Vite-App mit gemeinsamer Supabase-Datenspeicherung.

## Lokal starten
1. `npm install`
2. `.env.example` als `.env.local` kopieren und Supabase-Werte eintragen.
3. In Supabase den Inhalt von `supabase-weltkochen.sql` im SQL Editor ausführen.
4. `npm run dev`

## Online mit Vercel
Repository in Vercel importieren und dort die Environment Variables
`VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` eintragen. Build Command: `npm run build`, Output: `dist`.

## Standard-Admin
Benutzer: `admin`  
Passwort: `admin123`

Nach dem ersten Login das Admin-Passwort ändern.

## Hinweis
Diese Version ist für einen kleinen privaten Freundeskreis gedacht. Benutzer und Passwörter liegen im gemeinsamen App-Zustand. Für eine öffentlich beworbene Website sollte die Anmeldung später auf Supabase Auth + RLS umgestellt werden.
