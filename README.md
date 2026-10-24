# Afghan Bites — React + Node.js + PostgreSQL

A full-stack restaurant menu and preorder demo. The React/Vite frontend reads menu data from the Express API; menu changes, preorder requests, and contact messages are stored in PostgreSQL.

## Requirements
- Node.js 20+
- PostgreSQL 14+

## 1. Create the database
Create a database named `afghan_bites` in pgAdmin or `psql`:

```sql
CREATE DATABASE afghan_bites;
```

## 2. Configure the backend
Copy `.env.example` to `.env` in the project root. Set the real PostgreSQL password in `DATABASE_URL`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_REAL_PASSWORD@localhost:5432/afghan_bites
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

If the password contains URL-reserved characters such as `@`, `#`, `/`, `:` or `%`, URL-encode those characters. Do not put `.env` in `src` or `server`.

## 3. Create tables and sample data
Run these commands from the project root, in order:

```bash
psql -U postgres -d afghan_bites -f database/schema.sql
psql -U postgres -d afghan_bites -f database/seed.sql
```

Or open `database/schema.sql` and `database/seed.sql` in pgAdmin Query Tool and execute them against `afghan_bites` in that order.

## 4. Install dependencies

```bash
npm install
```

## 5. Start the backend
In terminal 1:

```bash
npm run server
```

Test the connection at <http://localhost:4000/api/health>. A successful response looks like:

```json
{"status":"ok","database":"connected"}
```

## 6. Start the frontend
In terminal 2, from the same project root:

```bash
npm run dev
```

Open the Vite URL, usually <http://localhost:5173>.

## API endpoints
- `GET /api/health` — checks database connection
- `GET /api/categories` — lists active categories
- `GET /api/menu` — fetches menu items from PostgreSQL
- `POST /api/menu` — creates a menu item
- `PUT /api/menu/:id` — updates a menu item
- `DELETE /api/menu/:id` — deletes a menu item
- `POST /api/orders` — validates and stores a preorder; server recalculates prices and delivery fee
- `POST /api/contact-messages` — stores a contact form message

The frontend API client is `src/api.js`. `src/App.jsx` fetches the menu from the API when the app loads. The Manage Menu page calls the create/update/delete endpoints. Preorder and Contact submit their forms to the backend. If the API cannot be reached, the app shows a warning and uses sample menu data as a fallback; changes cannot be saved until the backend is running.

## Important security note
This is a learning/demo project. Menu management endpoints are not protected by admin login, and there is no public order-management dashboard. Do not expose it publicly before adding authentication, authorization, rate limiting, HTTPS, and production-safe database credentials. Never put `DATABASE_URL` in frontend code.
