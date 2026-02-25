# CONTRIBUTING TO BEACON

## 1. THE MINDSET
Efficiency is King.
We are not building a bloated enterprise app. We are building a lean, mean, P2P machine.
Every byte counts. Every cycle counts.

## 2. CODE STYLE
- **Lint or Die:** If `pnpm lint` fails, your PR is dead.
- **No Magic:** Write code that explains itself. Comments are for *why*, not *what*.
- **Orange is the New Black:** Follow the branding guidelines. `bg-gradient-to-r from-orange-500 to-amber-600` for main accents.

## 3. PULL REQUESTS
- **One Feature, One PR:** Don't bundle a refactor with a new feature.
- **Test Your Sh*t:** If you break the build, you fix it. Immediately.
- **Description:** Explain what you did and why. If it's a UI change, include a screenshot.

## 4. ENVIRONMENT
- **Package Manager:** `pnpm`. Do not use `npm` or `yarn` for installation.
- **Frontend:** React + Vite.
- **Backend:** Node.js + Socket.IO.
- **Testing:** `pnpm test` (Vitest/Jest).

## 5. NO FREELOADERS (AGAIN)
Don't just open issues complaining. Submit a PR to fix it.
We are a community. We build together.
