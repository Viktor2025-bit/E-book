# BEMS Books

BEMS Books is a standalone ebook store built with an Express backend, Sequelize/PostgreSQL models, and a custom frontend served from `site/`.

## What The Store Supports

- Ebook catalog with categories, authors, formats, page counts, and cover images.
- Email/password registration and login.
- Google login route support when OAuth credentials are configured.
- Guest and customer carts.
- Paystack-ready checkout for paid order confirmation.
- Clean BEMS Books pages for homepage, catalog, product detail, cart, auth, about, contact, FAQ, and policies.

## Rollback Points

Before edits, the original folder was copied to a timestamped backup beside this project. The project was also initialized as a Git repository with a baseline commit:

```text
baseline before BEMS Books completion
```

Use Git commits to inspect or roll back individual milestones. Use the backup folder for a full-folder restore.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure `.env`:

```text
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/bems_books
SESSION_SECRET=replace-me
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
GOOGLE_CLIENT_ID=optional-google-client-id
GOOGLE_CLIENT_SECRET=optional-google-client-secret
```

3. Seed the database:

```bash
npm run seed
```

4. Start the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Render Deployment

This app is ready for Render deployment.

1. Push the repository to GitHub.
2. Create a new web service on Render and connect your GitHub repo.
3. Render will auto-detect Node.js. Set the build command to:

```bash
npm install
```

And start command to:

```bash
npm start
```

4. Add the required environment variables in Render:

- `PORT` (optional)
- `DATABASE_URL`
- `SESSION_SECRET`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

5. Provision a PostgreSQL database on Render, then copy its connection string into `DATABASE_URL`.
6. Deploy — Render builds and runs the app automatically. Open the auto-generated Render URL.

## Render Checklist

- Push the repo to GitHub.
- Create a new Render web service and connect the repo.
- Set build and start commands (see above).
- Add `DATABASE_URL`, `SESSION_SECRET`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
- Provision a PostgreSQL database in Render and copy its connection string to `DATABASE_URL`.
- Confirm the app starts by visiting the Render URL.

## Submission Notes

The checkout page shows a clear message if Paystack keys are missing. Google login remains visible, but redirects back to the login page with a helpful notice if OAuth keys are not configured.
