<h1 align="center">🎨 AI Image Generator SaaS – Next.js 2026 🚀</h1>

![Demo App](/public/screenshot-for-readme.png)

---

## 🚀 Highlights

- 🎨 AI Image Generation (powered by Google Gemini)
- 🏠 Premium Landing Page with 3D visuals & gradients
- 🔐 Authentication via Clerk (Google, GitHub, Email & Password)
- 🔑 Email Verification Flow
- 🧠 Multiple AI Presets:
  - Storybook
  - Anime Cel
  - Clay Render
  - PixArt
  - Voxel Block
  - Marble Sculpture
- 🧾 Image Generation History
- 📊 User Dashboard (track generations left)
- 💳 Subscription System:
  - Free Plan → 3 generations/month
  - Pro Plan ($19/month) → 75 generations
  - Studio Plan ($29/month) → 175 generations
- 🔄 Smart Upgrades (pay only the difference)
- 📆 Monthly & Yearly Plans Support
- 📩 Email Notifications & Receipts
- 📂 PostgreSQL + Drizzle ORM
- ⚡ Data Fetching with TanStack Query
- 🎨 Tailwind CSS + Shadcn UI
- 🛠️ Error Monitoring with Sentry
- 🤖 AI-assisted development workflow (Cline)
- 🚀 Deployment (free-tier friendly)

---

## 🧠 What You’ll Learn

- How to build a real AI SaaS product from scratch
- How to integrate Google Gemini for image generation
- Authentication & user management with Clerk
- Subscription payments & upgrade logic
- Database design with PostgreSQL + Drizzle
- Building premium 3D landing pages
- Production-ready architecture & workflows
- Deploying your app with a live URL

---

## 🏗️ Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + Shadcn
- **Auth:** Clerk
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Payments:** Clerk Billing
- **AI:** Google Gemini
- **Monitoring:** Sentry
- **Storage/CDN:** ImageKit

---

## ⚙️ .env Setup

```bash
DATABASE_URL="<your_database_url>"

NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="<your_imagekit_public_key>"
IMAGEKIT_PRIVATE_KEY="<your_imagekit_private_key>"

SENTRY_AUTH_TOKEN="<your_sentry_auth_token>"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your_clerk_publishable_key>"
CLERK_SECRET_KEY="<your_clerk_secret_key>"

GEMINI_API_KEY="<your_gemini_api_key>"


```

## 🚀 Run the app

```bash
npm install
npm run dev
```
