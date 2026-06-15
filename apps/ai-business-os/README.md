<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d9e9eacc-2b46-4ad0-91ed-0300d339c19c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the provider keys you want in `.env` for the first bootstrap, then manage enable/disable, routing and credential updates in `AI Control Center`. `GROQ_API_KEY` covers text by default and `GEMINI_API_KEY` enables Gemini text, grounded search, image, image editing and video on the backend router.
3. Run the app:
   `npm run dev`

## Stable local access

To serve the built app on a single local access without the Vite dev middleware, use:

1. Build the frontend:
   `npm run build`
2. Start the local server in production mode:
   `npm run start`

Or run both steps in sequence with:
`npm run local`

Default local port:
`http://localhost:3010`
