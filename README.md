# Ledgerly

A private, mobile-friendly personal expense tracker. It has a spreadsheet-like transaction editor, email sign-in, speech-to-text entry for Chrome on Android, a PWA install experience, and an AI assistant powered by NVIDIA's Build API.

## What you need

- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Build NVIDIA](https://build.nvidia.com) API key — the default free model is `meta/llama-3.2-3b-instruct`
- A [Vercel](https://vercel.com) account
- Node.js 20.9 or newer

## Run locally

1. Install packages: `npm install`
2. Copy `.env.example` to `.env.local`, then fill in the values.
3. In Supabase, open **SQL Editor**, paste and run [`supabase/schema.sql`](./supabase/schema.sql).
4. In **Authentication → URL Configuration**, add `http://localhost:3000` as a redirect URL.
5. Start it: `npm run dev` and open `http://localhost:3000`.

The app uses Supabase magic-link authentication. A transaction can only be read or changed by the signed-in user that created it; this is enforced by the database policies in the SQL file.

## Deploy to Vercel

1. Create a new GitHub repository and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial Ledgerly app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ledgerly.git
   git push -u origin main
   ```
2. Import the repository into Vercel. It detects Next.js automatically.
3. Add these Environment Variables in Vercel (for Production, Preview, and Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NVIDIA_API_KEY`
   - `NVIDIA_MODEL` (optional; defaults to `meta/llama-3.2-3b-instruct`)
4. Deploy. Copy the final `https://...vercel.app` URL.
5. Back in Supabase **Authentication → URL Configuration**, add your Vercel URL to both **Site URL** and **Redirect URLs**. Add it without a trailing slash.

## Use it on Android

Open the deployed site in Chrome. Tap the browser menu, then **Install app** (or **Add to Home screen**). It opens in its own app window. The microphone on the Add Transaction form uses the browser's speech recognition; Chrome on Android supports it. Allow microphone permission when asked.

## AI and privacy

`NVIDIA_API_KEY` is only read by `app/api/ai/route.ts` on the server. It is never sent to your phone/browser. When you ask Ledgerly a question, the current transaction data is sent to NVIDIA to answer the question. The API route limits the payload to the first 100 records.

NVIDIA's Build catalog provides the OpenAI-compatible endpoint at `https://integrate.api.nvidia.com/v1`. If the selected free model changes availability, change only `NVIDIA_MODEL` in Vercel.
