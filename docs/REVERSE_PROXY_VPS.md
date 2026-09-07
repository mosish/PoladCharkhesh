# Polad Charkhesh - Production Reverse Proxy Deployment Architecture

## Architecture Overview

```text
Internet (Clients / HTTPS)
       │
       ▼
[Nginx Reverse Proxy on VPS (Port 80 / 443)]
       │  - Terminates TLS/SSL (Let's Encrypt / Certbot)
       │  - Enforces HTTP/2, Gzip/Brotli, Static Caching
       │  - Appends real client IP to X-Forwarded-For
       │  - Forwards requests over local loopback
       ▼
[Node.js / Express Application (Port 3000, 127.0.0.1)]
       │  - app.set('trust proxy', 1)
       │  - Rate limiting based on authenticated proxy hop
       │  - SQLite database persistence
```

## Security & IP Spoofing Prevention

1. **Why arbitrary `X-Forwarded-For` is never trusted directly**:
   If an Express app directly reads `req.headers['x-forwarded-for']` without verifying proxy hops, an attacker can send:
   ```http
   X-Forwarded-For: 8.8.8.8, 1.1.1.1
   ```
   and bypass rate limits or pollute audit logs with forged IP identities.

2. **How Express `trust proxy` resolves this**:
   - With `app.set('trust proxy', 1)` (or configured `TRUST_PROXY=1`), Express considers only the **last hop** (the trusted Nginx reverse proxy) as authorized to relay upstream headers.
   - Express uses the client address right before the trusted proxy hop, ignoring any forged client headers injected from the internet.
   - In direct connections where no proxy is configured (`TRUST_PROXY=false`), Express completely ignores `X-Forwarded-For` and falls back to `req.socket.remoteAddress`.

## Production Nginx Configuration (VPS)

Place the following configuration inside `/etc/nginx/sites-available/poladcharkhesh.ir`:

```nginx
# Upstream Node.js application server
upstream polad_backend {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name poladcharkhesh.ir www.poladcharkhesh.ir poladcharkhesh.com www.poladcharkhesh.com;

    # Enforce HTTPS redirect
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name poladcharkhesh.ir www.poladcharkhesh.ir poladcharkhesh.com www.poladcharkhesh.com;

    # SSL Certificates (managed via Certbot)
    ssl_certificate /etc/letsencrypt/live/poladcharkhesh.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/poladcharkhesh.ir/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client body limit for product PDF/image media uploads
    client_max_body_size 20M;

    location / {
        proxy_pass http://polad_backend;
        proxy_http_version 1.1;

        # Upgrade headers for WebSocket/Vite or live subscriptions
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Real Client IP and Host headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Environment Variables Required in Production

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
TRUST_PROXY=1
SESSION_SECRET=<64-char-cryptographically-random-hex>
COOKIE_SECRET=<64-char-cryptographically-random-hex>
DATABASE_PATH=/var/data/poladcharkhesh/poladcharkhesh.db
```
