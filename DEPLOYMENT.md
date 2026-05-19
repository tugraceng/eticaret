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
npx prisma generate --schema=database/prisma/schema.prisma
npm run db:migrate:deploy
npm run build -w @platform/backend
npm run build -w @platform/frontend
```

### Backend build takılıyor gibi görünüyorsa

`nest build` çıktı vermeden dakikalarca sürebilir (özellikle 1 GB RAM VPS). Önce:

```bash
cd ~/eticaret
free -h
# Temiz build
rm -rf apps/backend/dist apps/backend/tsconfig.tsbuildinfo
export NODE_OPTIONS="--max-old-space-size=2048"
cd apps/backend && npm run build:tsc
```

`build:tsc` biterse `dist/main.js` oluşur; PM2 aynı dosyayı kullanır. Alternatif: `npm run build` (`nest build --tsc`).

OOM (bellek) şüphesi: `dmesg | tail -20` içinde `Killed process` arayın; gerekirse swap ekleyin.

## 3) PM2

Run:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Frontend `errored` / `Missing script: start` ise repo kökünden yeniden başlatın (ecosystem artık `next start` doğrudan çalıştırır):

```bash
cd ~/eticaret
npm run build -w @platform/frontend
pm2 delete eticaret-frontend 2>/dev/null || true
pm2 start ecosystem.config.cjs --only eticaret-frontend
pm2 save
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
