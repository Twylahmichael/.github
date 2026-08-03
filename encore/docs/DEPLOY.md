# Deploy

Target: a single small VPS. Caddy for TLS, systemd for the API, static hosting for the admin panel + embed bundle.

## One-time setup

```bash
# On the VPS as root
adduser --system --group encore
mkdir -p /var/lib/encore/uploads
chown -R encore:encore /var/lib/encore

# Node 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs caddy
```

## API — systemd unit

`/etc/systemd/system/encore-api.service`

```
[Unit]
Description=Encore API
After=network.target

[Service]
Type=simple
User=encore
WorkingDirectory=/srv/encore/apps/api
Environment=NODE_ENV=production
Environment=PORT=4000
Environment=ENCORE_DB_PATH=/var/lib/encore/data.db
EnvironmentFile=/etc/encore/api.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`/etc/encore/api.env` (mode 0600):

```
ENCORE_SESSION_SECRET=<64 random hex bytes>
ENCORE_ALLOWED_ORIGINS=https://efn.co.ke,https://www.efn.co.ke
```

## Caddy

`/etc/caddy/Caddyfile`

```
encore.twylah.co.ke {
  handle /api/* {
    reverse_proxy 127.0.0.1:4000
  }
  handle /embed.js /embed.css {
    root * /srv/encore/apps/embed/dist
    file_server
    header Cache-Control "public, max-age=300"
    header Access-Control-Allow-Origin "https://efn.co.ke"
  }
}

admin.encore.twylah.co.ke {
  root * /srv/encore/apps/admin/dist
  try_files {path} /index.html
  file_server
}
```

## Deploy from local

```bash
npm run build
rsync -avz --delete apps/api/         encore@vps:/srv/encore/apps/api/
rsync -avz --delete apps/embed/dist/  encore@vps:/srv/encore/apps/embed/dist/
rsync -avz --delete apps/admin/dist/  encore@vps:/srv/encore/apps/admin/dist/
ssh encore@vps 'cd /srv/encore/apps/api && npm ci --omit=dev && sudo systemctl restart encore-api'
```

## First run

```bash
ssh encore@vps 'cd /srv/encore/apps/api && ENCORE_OWNER_EMAIL=owner@efn.co.ke ENCORE_OWNER_PASSWORD=<pick one> npm run seed'
```

Log into `https://admin.encore.twylah.co.ke` and change the password immediately.

## Backups

```
0 3 * * *  encore  restic -r <repo> backup /var/lib/encore/
```

## WordPress side

Add once to the site's global header (Elementor → Site Settings → Custom Code):

```html
<link rel="stylesheet" href="https://encore.twylah.co.ke/embed.css">
<script defer src="https://encore.twylah.co.ke/embed.js"></script>
```

Then in each Elementor page, add an HTML widget with the appropriate mount div:

```html
<div id="encore-schedule"></div>
```

Mount IDs: `encore-schedule`, `encore-coaches`, `encore-events`, `encore-gallery`, `encore-marquee-stats`.
