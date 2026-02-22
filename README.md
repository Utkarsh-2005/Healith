This is a Next.js App Router project for the Healith MVP — AI Therapist with structured memory. It uses MongoDB for persistence and the Gemini API for responses.

## Getting Started

### Setup

1. Copy the environment template and fill values:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI` — your MongoDB connection string
- `GEMINI_API_KEY` — Google Gemini API key (free tier supported)

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Open `app/page.tsx` for the minimal chat UI. Click “Start Session” to begin, type a message, and “End Session” to persist summary and structured memories.

### Tech Notes

- MongoDB via Mongoose is initialized in `lib/db.ts`.
- Data models: `models/user.ts`, `models/session.ts`, `models/longTermMemory.ts`.
- Prompt building and memory injection lives in `lib/prompt.ts`.
- Server actions (Gemini calls, session tracking) are in `app/actions.ts`.

### Non-goals

No diagnosis, medical advice, or crisis handling; the assistant focuses on reflection and pattern awareness.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
