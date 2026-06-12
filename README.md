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

## Submission Notes

The checkout page shows a clear message if Paystack keys are missing. Google login remains visible, but redirects back to the login page with a helpful notice if OAuth keys are not configured.
