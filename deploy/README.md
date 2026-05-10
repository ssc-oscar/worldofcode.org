## Deployment

1. Configure backend secrets in `backend/.secrets.toml`:

```bash
nano ../backend/.secrets.toml
dynaconf_merge = true

[mongo]
url = "mongodb://da5:27017/WoC"

[clickhouse]
url = "clickhouse://da3:9000/default"
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
cp -r deploy/nginx.conf /etc/nginx/conf.d/worldofcode.conf
```

4. Copy certificates to `/etc/nginx/ssl/`:

```bash
ssl
├── worldofcode.org.crt
├── worldofcode.org.key
└── worldofcode.org.pass  # <- certificate password (optional)
```


5. Make sure file paths are up-to-date (install python-woc if it is not installed)
```bash
python3 -m woc.detect /da5_fast /da3_fast /da4_fast /da8_data/basemaps /da0_data/basemaps /da5_data/basemaps /da5_data/All.blobs > wocprofile.json
sudo cp -p wocprofile.json /home/wocprofile.json
```
every time WoC version or other data, like .tch files are moved or new ones created please rerun this.

6. Start docker container and nginx:

```bash
cd deploy
docker compose build
docker compose up -d
sudo systemctl start nginx

# If just changing nginx config
sudo systemctl reload nginx
```

**Note**: If using drs api, make sure SELinux allows outbound TCP connections:
```bash
sudo setsebool -P httpd_can_network_connect 1
```

