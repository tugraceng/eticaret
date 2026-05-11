# Production Deployment (Ubuntu + PM2 + Nginx)

## 1) Environment

Set these env vars:

- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `NEXT_PUBLIC_API_URL=http://SERVER_IP/api`
- `CORS_ORIGIN=http://SERVER_IP`
- `PUBLIC_WEB_URL=http://SERVER_IP`

## 2) Install and build

```bash
npm install
npm run db:migrate:deploy
npm run build -w @platform/backend
npm run build -w @platform/frontend
```

## 3) PM2

Run:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Notes:

- Backend runs as `dist/main.js` (NestJS compiled output)
- Frontend start script checks `.next` exists before `next start`

## 4) Nginx

Use:

Yükleme (ürün / hero görseli) için Nginx varsayılanında **413 Request Entity Too Large** hatası oluşabilir. `server` bloğuna (veya ilgili `location` içine) şunu ekleyin:

```nginx
client_max_body_size 25m;
```

Örnek tam yapı:

```nginx
server {
  listen 80;
  server_name _;

  client_max_body_size 25m;

  location /api/ {
    proxy_pass http://localhost:4000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    proxy_pass http://localhost:4000/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5) Prisma strategy

- Preferred in production: `npm run db:migrate:deploy`
- Emergency/sync-only fallback: `npm run db:push`
