'use client'

import { useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Check, Copy, Container, FileText, Lock, Server, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────── */

interface EnvVar {
    key: string
    value: string
    comment?: string
}

interface ServiceDef {
    id: string
    label: string
    description: string
    category: 'core' | 'service' | 'utility'
    required?: boolean
    compose: string
    volumes?: string[]
    networks?: string[]
    dependsOn?: string[]
    envVars: EnvVar[]
}

/* ─── Random secret generator ───────────────────────────────── */

function generateSecret(bytes = 32): string {
    const arr = new Uint8Array(bytes)
    crypto.getRandomValues(arr)
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

/* ─── Global env vars (always at top) ──────────────────────── */

const GLOBAL_ENV: EnvVar[] = [
    { key: 'SERVER_IP', value: 'your-server-ip-or-domain', comment: 'General' },
]

/* ─── Service definitions ───────────────────────────────────── */

const SERVICES: ServiceDef[] = [
    {
        id: 'mysagra-backend',
        label: 'MySagra API',
        description: 'Main backend REST API',
        category: 'core',
        required: true,
        compose: `  mysagra-backend:
    image: ghcr.io/mysagra/mysagra-backend:latest
    container_name: mysagra-api
    env_file: .env
    ports:
      - "4300:4300"
    environment:
      - NODE_ENV=\${NODE_ENV:-production}
      - DATABASE_URL=mysql://\${DB_USER:-mysagra}:\${DB_USER_PASSWORD:-mysagra}@db:3306/\${MYSQL_DATABASE:-mysagra}
      - JWT_SECRET=\${JWT_SECRET}
      - PEPPER=\${PEPPER}
      - ALLOWED_ORIGINS=\${ALLOWED_ORIGINS}
      - MIGRATE_ON_START=true
      - TRUST_PROXY_LEVEL=\${TRUST_PROXY_LEVEL:-2}
    depends_on:
      db:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4300/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    volumes:
      - api_logs:/app/logs
      - api_public:/app/public
    tmpfs:
      - /tmp
      - /run
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - mysagra-network`,
        volumes: ['api_logs', 'api_public'],
        networks: ['mysagra-network'],
        dependsOn: ['db'],
        envVars: [
            { key: 'PEPPER', value: '__PEPPER__', comment: 'MySagra Backend' },
            { key: 'JWT_SECRET', value: '__JWT_SECRET__' },
            { key: 'ALLOWED_ORIGINS', value: '"https://${SERVER_IP},http://${SERVER_IP}"' },
            { key: 'NODE_ENV', value: 'production' },
            { key: 'TRUST_PROXY_LEVEL', value: '2' },
        ],
    },
    {
        id: 'db',
        label: 'MySQL',
        description: 'Primary relational database',
        category: 'core',
        required: true,
        compose: `  db:
    image: mysql:latest
    container_name: db
    env_file: .env
    environment:
      MYSQL_ROOT_PASSWORD: \${ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: "\${MYSQL_DATABASE:-mysagra}"
      MYSQL_USER: "\${DB_USER:-mysagra}"
      MYSQL_PASSWORD: \${DB_USER_PASSWORD:-mysagra}
    volumes:
      - mysql_data:/var/lib/mysql:delegated
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "3306:3306"
    restart: always
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - DAC_OVERRIDE
      - NET_BIND_SERVICE
    security_opt:
      - seccomp=unconfined
    user: mysql
    networks:
      - mysagra-network`,
        volumes: ['mysql_data'],
        networks: ['mysagra-network'],
        envVars: [
            { key: 'DB_USER', value: '"mysagra"', comment: 'Database' },
            { key: 'DB_USER_PASSWORD', value: '__DB_USER_PASSWORD__' },
            { key: 'MYSQL_DATABASE', value: '"mysagra"' },
            { key: 'ROOT_PASSWORD', value: '__ROOT_PASSWORD__' },
        ],
    },
    {
        id: 'mycassa',
        label: 'MyCassa',
        description: 'Internal point-of-sale frontend for cash registers',
        category: 'service',
        compose: `  mycassa:
    image: ghcr.io/mysagra/mysagra-mycassa:latest
    container_name: mycassa-cassa
    restart: always
    ports:
      - "7000:7000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - AUTH_URL=\${AUTH_URL_CASSA}
      - NODE_EXTRA_CA_CERTS=/app/rootCA.pem
    volumes:
      - ./rootCA.pem:/app/rootCA.pem:ro
    networks:
      - mysagra-network`,
        networks: ['mysagra-network'],
        dependsOn: ['mysagra-backend'],
        envVars: [
            { key: 'API_URL', value: 'http://mysagra-api:4300', comment: 'MyCassa & MyAmministratore' },
            { key: 'AUTH_SECRET', value: '__AUTH_SECRET__' },
            { key: 'AUTH_URL_CASSA', value: 'https://${SERVER_IP}', comment: 'MyCassa' },
        ],
    },
    {
        id: 'myamministratore',
        label: 'MyAmministratore',
        description: 'Admin dashboard frontend',
        category: 'service',
        compose: `  myamministratore:
    image: ghcr.io/mysagra/mysagra-myamministratore:latest
    container_name: myamministratore-amministratore
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - AUTH_URL=\${AUTH_URL_AMMINISTRATORE}
      - NODE_EXTRA_CA_CERTS=/app/rootCA.pem
    volumes:
      - ./rootCA.pem:/app/rootCA.pem:ro
    networks:
      - mysagra-network`,
        networks: ['mysagra-network'],
        dependsOn: ['mysagra-backend'],
        envVars: [
            { key: 'AUTH_URL_AMMINISTRATORE', value: 'https://${SERVER_IP}:81', comment: 'MyAmministratore' },
            { key: 'API_URL', value: 'http://mysagra-api:4300' },
            { key: 'AUTH_SECRET', value: '__AUTH_SECRET__' },
        ],
    },
    {
        id: 'mystampa',
        label: 'MyStampa',
        description: 'Print service for order tickets',
        category: 'service',
        compose: `  mystampa:
    image: ghcr.io/mysagra/mysagra-mystampa:latest
    container_name: mystampa-stampa
    restart: always
    depends_on:
      mysagra-backend:
        condition: service_healthy
    ports:
      - "1234:1234"
    env_file:
      - .env
    volumes:
      - ./assets:/app/assets
    environment:
      - NODE_ENV=production
      - ADMIN_USERNAME=\${ADMIN_USERNAME}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD}
      - USE_SSE=\${USE_SSE}
      - SSE_URL=\${SSE_URL}
      - EXTERNAL_BASE_URL=\${API_URL}
      - SINGLE_TICKET_CATEGORIES=\${SINGLE_TICKET_CATEGORIES}
      - PORT=1234
    networks:
      - mysagra-network`,
        networks: ['mysagra-network'],
        dependsOn: ['mysagra-backend'],
        envVars: [
            { key: 'ADMIN_USERNAME', value: 'admin', comment: 'MyStampa' },
            { key: 'ADMIN_PASSWORD', value: 'change-me-admin-password' },
            { key: 'USE_SSE', value: 'true' },
            { key: 'SSE_URL', value: 'http://mysagra-api:4300/events/printer' },
            { key: 'MYSTAMPA_API_KEY', value: 'ms_pt_CHANGE_ME' },
        ],
    },
    {
        id: 'redis',
        label: 'Redis',
        description: 'In-memory cache for the backend',
        category: 'core',
        compose: `  redis:
    image: redis:alpine
    container_name: redis
    command: redis-server --requirepass \${REDIS_PASS}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - mysagra-network`,
        volumes: ['redis_data'],
        networks: ['mysagra-network'],
        envVars: [
            { key: 'REDIS_PASS', value: '__REDIS_PASS__', comment: 'Redis' },
            { key: 'REDIS_URL', value: 'redis://:${REDIS_PASS}@redis:6379' },
        ],
    },
    {
        id: 'mynumeri',
        label: 'MyNumeri',
        description: 'Number queue display service',
        category: 'service',
        compose: `  mynumeri:
    image: ghcr.io/mysagra/mysagra-mynumeri:latest
    container_name: mynumeri
    restart: always
    ports:
      - "3033:3033"
    env_file: .env
    environment:
      - NODE_ENV=production
      - AUTH_URL=\${AUTH_URL_NUMERI}
      - NODE_EXTRA_CA_CERTS=/app/rootCA.pem
    volumes:
      - ./rootCA.pem:/app/rootCA.pem:ro
    networks:
      - mysagra-network`,
        networks: ['mysagra-network'],
        dependsOn: ['mysagra-backend'],
        envVars: [
            { key: 'AUTH_URL_NUMERI', value: 'https://${SERVER_IP}:3033', comment: 'MyNumeri' },
        ],
    },
    {
        id: 'myclienti',
        label: 'MyClienti',
        description: 'Client-facing order placement webapp',
        category: 'service',
        compose: `  myclienti:
    image: ghcr.io/mysagra/mysagra-myclienti:latest
    container_name: myclienti
    restart: always
    ports:
      - "3034:3034"
    env_file: .env
    environment:
      - NODE_ENV=production
      - AUTH_URL=\${AUTH_URL_CLIENTI}
      - NODE_EXTRA_CA_CERTS=/app/rootCA.pem
    volumes:
      - ./rootCA.pem:/app/rootCA.pem:ro
    networks:
      - mysagra-network`,
        networks: ['mysagra-network'],
        dependsOn: ['mysagra-backend'],
        envVars: [
            { key: 'AUTH_URL_CLIENTI', value: 'https://${SERVER_IP}:3034', comment: 'MyClienti' },
            { key: 'MYCLIENTI_API_KEY', value: 'ms_wb_CHANGE_ME' },
            { key: 'REQUIRE_TABLE', value: 'false' },
        ],
    },
    {
        id: 'dbgate',
        label: 'DBGate',
        description: 'Database administration UI',
        category: 'utility',
        compose: `  dbgate:
    image: dbgate/dbgate:latest
    container_name: mysagra-dbgate
    restart: always
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      - DBGATE_USER=\${DBGATE_USER}
      - DBGATE_PASSWORD=\${DBGATE_PASSWORD}
      - CONNECTIONS=con1
      - con1_driver=mysql
      - con1_server=db
      - con1_port=3306
      - con1_user=\${DB_USER:-mysagra}
      - con1_password=\${DB_USER_PASSWORD}
      - con1_database=\${MYSQL_DATABASE:-mysagra}
    networks:
      - mysagra-network`,
        networks: ['mysagra-network'],
        dependsOn: ['db'],
        envVars: [
            { key: 'DBGATE_USER', value: 'admin', comment: 'DBGate' },
            { key: 'DBGATE_PASSWORD', value: 'change-me-dbgate-password' },
        ],
    },
    {
        id: 'nginx',
        label: 'Nginx',
        description: 'Reverse proxy with SSL termination (recommended)',
        category: 'utility',
        // compose built dynamically via buildNginxCompose()
        compose: '',
        volumes: ['nginx_certs'],
        networks: ['mysagra-network'],
        envVars: [],
    },
]

/* ─── Nginx dynamic compose block ───────────────────────────── */

function buildNginxCompose(selected: Set<string>): string {
    const deps: string[] = []
    if (selected.has('mysagra-backend')) deps.push('      - mysagra-backend')
    if (selected.has('mycassa')) deps.push('      - mycassa')
    if (selected.has('myamministratore')) deps.push('      - myamministratore')
    if (selected.has('mynumeri')) deps.push('      - mynumeri')
    if (selected.has('myclienti')) deps.push('      - myclienti')

    const ports = ['      - "80:80"', '      - "443:443"']
    if (selected.has('myamministratore')) ports.push('      - "81:81"')
    if (selected.has('mynumeri')) ports.push('      - "3033:3033"')
    if (selected.has('myclienti')) ports.push('      - "3034:3034"')
    if (selected.has('mystampa')) ports.push('      - "3032:3032"')

    return `  nginx:
    image: nginx:alpine
    container_name: mysagra-nginx
    restart: always
    ports:
${ports.join('\n')}
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    networks:
      - mysagra-network${deps.length > 0 ? `\n    depends_on:\n${deps.join('\n')}` : ''}`
}

/* ─── Nginx conf generator ───────────────────────────────────── */

function generateNginxConf(selected: Set<string>): string {
    const hasApi = selected.has('mysagra-backend')
    const hasCassa = selected.has('mycassa')
    const hasAdmin = selected.has('myamministratore')
    const hasNumeri = selected.has('mynumeri')
    const hasClienti = selected.has('myclienti')
    const hasStampa = selected.has('mystampa')

    const cassaSseBlock = hasCassa ? `
        location /api/events/ {
            proxy_pass http://mycassa-cassa:7000;
            proxy_buffering off;
            proxy_cache off;
            gzip off;
            chunked_transfer_encoding off;
            proxy_http_version 1.1;
            proxy_set_header Connection '';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 24h;
        }` : ''

    const sseApiBlock = hasApi ? `
        location /events/ {
            proxy_pass http://mysagra-api:4300;
            proxy_buffering off;
            proxy_cache off;
            gzip off;
            proxy_http_version 1.1;
            proxy_set_header Connection '';
            proxy_read_timeout 24h;
            proxy_set_header Host $host;
            proxy_set_header X-Accel-Buffering no;
            chunked_transfer_encoding off;
        }` : ''

    const apiBlock = hasApi ? `
        location ~ ^/(api-docs|v1|auth) {
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' $http_origin always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
            proxy_pass http://mysagra-api:4300;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }` : ''

    const rootBlock = hasCassa ? `
        location / {
            allow 172.0.0.0/8;
            allow 192.168.1.0/24;
            allow 127.0.0.1;
            deny all;

            proxy_pass http://mycassa-cassa:7000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            expires -1;
            add_header Pragma "no-cache";
            add_header Cache-Control "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
        }` : `
        location / {
            return 200 'MySagra OK';
            add_header Content-Type text/plain;
        }`

    const stampaBlock = hasStampa ? `

    # --- MyStampa (port 3032) ---
    server {
        listen 3032 ssl;
        server_name \${SERVER_IP} localhost;
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        location / {
            proxy_pass http://mystampa-stampa:1234/;
            proxy_set_header Host $host:$server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            expires -1;
            add_header Pragma "no-cache";
            add_header Cache-Control "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
        }
    }` : ''

    const adminBlock = hasAdmin ? `

    # --- Admin panel (port 81) ---
    server {
        listen 81 ssl;
        server_name \${SERVER_IP} localhost;
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        location / {
            proxy_pass http://myamministratore-amministratore:3000/;
            proxy_set_header Host $host:$server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            expires -1;
            add_header Pragma "no-cache";
            add_header Cache-Control "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
        }
    }` : ''

    const numeriBlock = hasNumeri ? `

    # --- MyNumeri (port 3033) ---
    server {
        listen 3033 ssl;
        server_name \${SERVER_IP} localhost;
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        location / {
            proxy_pass http://mynumeri:3033/;
            proxy_set_header Host $host:$server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            expires -1;
            add_header Pragma "no-cache";
            add_header Cache-Control "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
        }
    }` : ''

    const clientiBlock = hasClienti ? `

    # --- MyClienti (port 3034) ---
    server {
        listen 3034 ssl;
        server_name \${SERVER_IP} localhost;
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        location / {
            proxy_pass http://myclienti:3034/;
            proxy_set_header Host $host:$server_port;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            expires -1;
            add_header Pragma "no-cache";
            add_header Cache-Control "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
        }
    }` : ''

    return `worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format custom '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent"';

    access_log /var/log/nginx/access.log custom;
    error_log /var/log/nginx/error.log warn;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # --- HTTP to HTTPS redirect ---
    server {
        listen 80;
        server_name \${SERVER_IP} localhost;
        return 301 https://$host$request_uri;
    }

    # --- Main HTTPS server ---
    server {
        listen 443 ssl;
        server_name \${SERVER_IP} localhost;

        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
${cassaSseBlock}${sseApiBlock}${apiBlock}${rootBlock}
    }${stampaBlock}${adminBlock}${numeriBlock}${clientiBlock}
}`
}

const CATEGORY_LABELS: Record<string, string> = {
    core: 'Core (required)',
    service: 'Services',
    utility: 'Utilities',
}

const CATEGORY_COLORS: Record<string, string> = {
    core: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    service: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    utility: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
}

type Tab = 'compose' | 'env' | 'nginx'

/* ─── Component ──────────────────────────────────────────── */

export default function DockerComposeGenerator() {
    const defaultIds = SERVICES.filter(s => s.required).map(s => s.id).concat(['nginx', 'redis', 'myamministratore'])
    const [selected, setSelected] = useState<Set<string>>(new Set(defaultIds))
    const [copied, setCopied] = useState<Tab | null>(null)
    const [activeTab, setActiveTab] = useState<Tab>('compose')
    const [expanded, setExpanded] = useState<Set<Tab>>(new Set())
    const [secrets, setSecrets] = useState(() => ({
        JWT_SECRET: generateSecret(),
        PEPPER: generateSecret(),
        AUTH_SECRET: generateSecret(),
        ROOT_PASSWORD: generateSecret(16),
        DB_USER_PASSWORD: generateSecret(16),
        REDIS_PASS: generateSecret(16),
        MYSTAMPA_API_KEY: generateSecret(32),
        MYCLIENTI_API_KEY: generateSecret(32),
    }))

    function regenerateSecrets() {
        setSecrets({
            JWT_SECRET: generateSecret(),
            PEPPER: generateSecret(),
            AUTH_SECRET: generateSecret(),
            ROOT_PASSWORD: generateSecret(16),
            DB_USER_PASSWORD: generateSecret(16),
            REDIS_PASS: generateSecret(16),
            MYSTAMPA_API_KEY: generateSecret(32),
            MYCLIENTI_API_KEY: generateSecret(32),
        })
    }

    function resolveValue(value: string): string {
        return value
            .replace('__JWT_SECRET__', secrets.JWT_SECRET)
            .replace('__PEPPER__', secrets.PEPPER)
            .replace('__AUTH_SECRET__', secrets.AUTH_SECRET)
            .replace('__ROOT_PASSWORD__', secrets.ROOT_PASSWORD)
            .replace('__DB_USER_PASSWORD__', secrets.DB_USER_PASSWORD)
            .replace('__REDIS_PASS__', secrets.REDIS_PASS)
    }

    function toggle(id: string) {
        const svc = SERVICES.find(s => s.id === id)
        if (svc?.required) return

        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
                svc?.dependsOn?.forEach(dep => next.add(dep))
            }
            return next
        })
    }

    function toggleExpanded(tab: Tab) {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(tab)) next.delete(tab)
            else next.add(tab)
            return next
        })
    }

    const envContent = useMemo(() => {
        const active = SERVICES.filter(s => selected.has(s.id))
        const seen = new Set<string>()
        const lines: string[] = []

        // SERVER_IP always first
        for (const ev of GLOBAL_ENV) {
            if (seen.has(ev.key)) continue
            seen.add(ev.key)
            if (ev.comment) lines.push(`# ${ev.comment}`)
            lines.push(`${ev.key}=${resolveValue(ev.value)}`)
        }

        // API Keys section (top, after SERVER_IP)
        const apiKeys: string[] = []
        for (const svc of active) {
            for (const ev of svc.envVars) {
                if (ev.key.includes('API_KEY') && !seen.has(ev.key)) {
                    apiKeys.push(`${ev.key}=${resolveValue(ev.value)}`)
                    seen.add(ev.key)
                }
            }
        }
        if (apiKeys.length > 0) {
            lines.push('')
            lines.push('# API Keys')
            lines.push(...apiKeys)
        }

        // Remaining service envVars
        for (const svc of active) {
            for (const ev of svc.envVars) {
                if (seen.has(ev.key) || ev.key.includes('API_KEY')) continue
                seen.add(ev.key)
                // every var with a comment opens a new section
                if (ev.comment) {
                    lines.push('')
                    lines.push(`# ${ev.comment}`)
                }
                lines.push(`${ev.key}=${resolveValue(ev.value)}`)
            }
        }

        return lines.join('\n')
    }, [selected, secrets])

    const yaml = useMemo(() => {
        if (selected.size === 0) return ''

        const active = SERVICES.filter(s => selected.has(s.id))
        const allVolumes = active.flatMap(s => s.volumes ?? [])
        const uniqueVolumes = [...new Set(allVolumes)]
        const allNetworks = active.flatMap(s => s.networks ?? [])
        const uniqueNetworks = [...new Set(allNetworks)]

        let out = `name: mysagra\n\nservices:\n`
        out += active
            .map(s => s.id === 'nginx' ? buildNginxCompose(selected) : s.compose)
            .join('\n\n')

        if (uniqueVolumes.length > 0) {
            out += `\n\nvolumes:\n`
            out += uniqueVolumes.map(v => `  ${v}:\n    driver: local`).join('\n')
        }

        if (uniqueNetworks.length > 0) {
            out += `\n\nnetworks:\n`
            out += uniqueNetworks.map(n => `  ${n}:\n    driver: bridge`).join('\n')
        }

        return out
    }, [selected])

    const nginxConf = useMemo(() => {
        if (!selected.has('nginx')) return ''
        return generateNginxConf(selected)
    }, [selected])

    async function copyToClipboard(type: Tab) {
        const text = type === 'compose' ? yaml : type === 'env' ? envContent : nginxConf
        await navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    const showNginxTab = selected.has('nginx')
    const categories = ['core', 'service', 'utility'] as const
    const currentOutput = activeTab === 'compose' ? yaml : activeTab === 'env' ? envContent : nginxConf
    const fileName = activeTab === 'compose' ? 'docker-compose.yml' : activeTab === 'env' ? '.env' : 'nginx.conf'
    const isExpanded = expanded.has(activeTab)

    return (
        <div className="space-y-8">
            {/* ── Service selection ── */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map(cat => (
                    <Card key={cat}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Badge className={CATEGORY_COLORS[cat]} variant="secondary">
                                    {CATEGORY_LABELS[cat]}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                {cat === 'core' ? 'Always included in the stack' : 'Select the services to include'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {SERVICES.filter(s => s.category === cat).map(svc => (
                                <label
                                    key={svc.id}
                                    className={`flex items-start gap-3 group ${svc.required ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                                >
                                    <Checkbox
                                        checked={selected.has(svc.id)}
                                        onCheckedChange={() => toggle(svc.id)}
                                        disabled={svc.required}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-medium leading-none group-hover:underline flex items-center gap-1.5">
                                            {svc.label}
                                            {svc.required && <Lock className="size-3 text-muted-foreground" />}
                                        </span>
                                        <p className="text-xs text-muted-foreground">
                                            {svc.description}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator />

            <div className='flex flex-col gap-5'>
                <span className="text-xs text-muted-foreground/70">
                    * Secrets (JWT_SECRET, PEPPER, AUTH_SECRET, DB_USER_PASSWORD, ROOT_PASSWORD, REDIS_PASS) are randomly generated client-side on each page load. Click &quot;Regenerate&quot; to get new values. Replace API key placeholders (ms_pt_CHANGE_ME, ms_wb_CHANGE_ME) with real keys after creating them in the admin panel.
                </span>

                {/* ── Output ── */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex rounded-lg border p-0.5 bg-muted/50 overflow-x-auto gap-0.5 flex-1 sm:flex-none">
                                <button
                                    onClick={() => setActiveTab('compose')}
                                    className={`flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-md px-2 py-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'compose'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="docker-compose.yml"
                                >
                                    <Container className="size-5 sm:size-3.5" />
                                    <span className="hidden sm:inline">docker-compose.yml</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('env')}
                                    className={`flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-md px-2 py-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'env'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title=".env"
                                >
                                    <FileText className="size-5 sm:size-3.5" />
                                    <span className="hidden sm:inline">.env</span>
                                </button>
                                {showNginxTab && (
                                    <button
                                        onClick={() => setActiveTab('nginx')}
                                        className={`flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-md px-2 py-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${activeTab === 'nginx'
                                            ? 'bg-background shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        title="nginx.conf"
                                    >
                                        <Server className="size-5 sm:size-3.5" />
                                        <span className="hidden sm:inline">nginx.conf</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                {activeTab === 'env' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={regenerateSecrets}
                                        className="gap-1.5 text-muted-foreground"
                                        title="Regenerate secrets"
                                    >
                                        <RefreshCw className="size-3.5" />
                                        <span className="hidden sm:inline">Regenerate</span>
                                        <span className="sm:hidden">Regenerate</span>
                                    </Button>
                                )}
                                {currentOutput && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(activeTab)}
                                        className="gap-1.5"
                                    >
                                        {copied === activeTab ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                        {copied === activeTab ? 'Copied!' : 'Copy'}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <CardDescription className="flex flex-col gap-1">
                            <span>
                                {selected.size === 0
                                    ? 'Select at least one service to generate the files'
                                    : `${selected.size} service${selected.size > 1 ? 's' : ''} selected — viewing ${fileName}`}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentOutput ? (
                            <div>
                                {/* Code block with vertical clip */}
                                <div className="relative">
                                    <div
                                        className={`overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 ${isExpanded ? '' : 'max-h-72'
                                            }`}
                                    >
                                        <pre className="overflow-x-auto p-4 text-sm text-neutral-800 dark:text-neutral-50">
                                            <code>{currentOutput}</code>
                                        </pre>
                                    </div>
                                    {/* Gradient overlay sits flush inside the clipped box */}
                                    {!isExpanded && (
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-lg bg-linear-to-t from-neutral-50 dark:from-neutral-950 to-transparent" />
                                    )}
                                </div>
                                {/* Toggle buttons outside the max-h container */}
                                <div className="mt-2 flex justify-center">
                                    <button
                                        onClick={() => toggleExpanded(activeTab)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-4 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        {isExpanded
                                            ? <><ChevronUp className="size-3.5" /> Collapse</>
                                            : <><ChevronDown className="size-3.5" /> Show all</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                                No services selected
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
