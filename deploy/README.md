## Deployment

1. Configure backend secrets in `backend/.secrets.toml`:

```bash
nano ../backend/.secrets.toml
dynaconf_merge = true

[mongo]
url = "mongodb://da5:27017/WoC"

[clickhouse]
url = "clickhouse://da1:9000/default"
...
```

2. Build frontend:

```bash
cd frontend
pnpm run build  # local build
# or
bash build_docker.sh  # build in docker
```

3. Copy frontend build to nginx:

```bash
cp -r ../frontend/dist /usr/share/nginx/html
cp -r ../frontend/nginx.conf /etc/nginx/conf.d/worldofcode.conf
```

4. Copy certificates to `/etc/nginx/ssl/`:

```bash
ssl
├── worldofcode.org.crt
├── worldofcode.org.key
└── worldofcode.org.pass  # <- certificate password (optional)
```

5. Start docker container and nginx:

```bash
sudo docker compose up -d
sudo systemctl start nginx
```
