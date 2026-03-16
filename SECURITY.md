# Backend security

## What’s in place

- **Passwords**: Hashed with bcrypt before saving (see `schema/LoginScema.js`).
- **Input validation**: Email format and length; password length (6–128 chars). Trim/lowercase email. See `middleware/validateAuth.js`.
- **Rate limiting**: Auth routes (`/user/*`) limited to 20 requests per 15 minutes per IP to reduce brute force and abuse.
- **Security headers**: `helmet` adds safe defaults (X-Content-Type-Options, etc.).
- **JWT on login**: Login returns a signed token. Use `JWT_SECRET` in production and optional `JWT_EXPIRES_IN` (default `7d`). Use `middleware/authJwt.verifyToken` on any route that must require a logged-in user.
- **Safe error responses**: Registration/login don’t expose stack traces or internal errors (generic messages only).

## Required environment variables

In `.env`:

- `ATLAS_URI` – MongoDB connection string (use double quotes if the password has special characters).
- `JWT_SECRET` – Long, random secret for signing JWTs (e.g. 32+ chars). **Use a strong value in production.**
- Optional: `JWT_EXPIRES_IN` – Token lifetime (e.g. `7d`, `24h`). Default: `7d`.
- Optional: `PORT` – Server port. Default: `5000`.

## Recommendations for production

1. **HTTPS**: Serve the API over HTTPS only.
2. **CORS**: Restrict `cors()` to your front-end origin(s) instead of `*`.
3. **JWT_SECRET**: Generate a strong secret (e.g. `openssl rand -base64 32`) and never commit it.
4. **Database**: Use a dedicated DB user with minimal required permissions; avoid the root user.
5. **Secrets**: Keep `.env` out of version control; use your host’s env or secrets manager in production.
