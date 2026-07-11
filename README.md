# Ledgerly

A simple, mobile-first personal expense tracker. Type a sentence like *"ate a samosa, paid 15rs"* into the bar and a transaction is added automatically (parsed by an AI model, with a plain-number fallback). End your message with `?` to ask questions about your spending. Installable as a PWA on Android, with speech-to-text entry in Chrome.

There is no sign-in: anyone who has the URL can view and edit the sheet, so keep the link to yourself.

## What you need

- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Build NVIDIA](https://build.nvidia.com) API key — the default free model is `meta/llama-3.2-3b-instruct`
- A [Vercel](https://vercel.com) account
- Node.js 20.9 or newer

## Run locally

1. Install packages: `npm install`
2. Copy `.env.example` to `.env.local`, then fill in the values.
3. In Supabase, open **SQL Editor**, paste and run [`supabase/schema.sql`](./supabase/schema.sql). (If your database was created with an older version that had accounts, run [`supabase/remove-auth.sql`](./supabase/remove-auth.sql) once instead.)
4. Start it: `npm run dev` and open `http://localhost:3000`.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel. It detects Next.js automatically.
3. Add these Environment Variables in Vercel (for Production, Preview, and Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NVIDIA_API_KEY`
   - `NVIDIA_MODEL` (optional; defaults to `meta/llama-3.2-3b-instruct`)
4. Deploy. Every later push to `main` deploys automatically.
5. In the Vercel project, set **Settings → Deployment Protection → Vercel Authentication** to **Disabled** so the site opens without a Vercel login.

## Use it on Android

Open the deployed site in Chrome. Tap the browser menu, then **Install app** (or **Add to Home screen**). It opens in its own app window. The microphone button uses the browser's speech recognition; allow microphone permission when asked.

## AI and privacy

`NVIDIA_API_KEY` is only read on the server (`app/api/ai/route.ts` and `app/api/parse/route.ts`). It is never sent to your phone/browser. When you add or ask something, the text (and for questions, the newest 100 transactions) is sent to NVIDIA's API to be processed.

NVIDIA's Build catalog provides the OpenAI-compatible endpoint at `https://integrate.api.nvidia.com/v1`. If the selected free model changes availability, change only `NVIDIA_MODEL` in Vercel.
