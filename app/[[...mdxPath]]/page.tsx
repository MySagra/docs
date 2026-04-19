import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '@/lib/mdx-components'
import DockerComposeGenerator from '@/app/_components/docker-compose-generator'
import { TriangleAlert } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const mdxPath = params.mdxPath ?? []

  if (mdxPath.length > 0 && mdxPath[0]?.startsWith('.')) {
    return { title: 'MySagra Docs' }
  }

  if (mdxPath.length === 1 && mdxPath[0] === 'quick-start') {
    return {
      title: 'Quick Start – MySagra Docs',
      description: 'Deploy MySagra with Docker Compose in minutes.',
    }
  }

  try {
    const { metadata } = await importPage(mdxPath)
    return metadata
  } catch {
    return { title: 'MySagra Docs' }
  }
}

const Wrapper = getMDXComponents({}).wrapper

function StepHeader({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <span className="shrink-0 flex size-9 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 font-bold text-base">
        {n}
      </span>
      <div>
        <h2 className="text-xl font-bold leading-none mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800">
      {children}
    </code>
  )
}

export default async function Page(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params

  // "/quick-start" → custom Quick Start page
  if (params.mdxPath?.length === 1 && params.mdxPath[0] === 'quick-start') {
    return (
      <Wrapper toc={[]} metadata={{ title: 'Quick Start', filePath: '' }} sourceCode={''}>
        <div className="mx-auto max-w-4xl px-6 py-16 space-y-16">

          {/* ── Header ── */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Quick Start</h1>
            <p className="text-lg text-muted-foreground">
              Deploy MySagra on your server in four steps — no prior configuration needed.
            </p>
          </div>

          {/* ══════════════════════════════════════════════════
              STEP 0 — Prerequisites
          ══════════════════════════════════════════════════ */}
          <section>
            <StepHeader
              n={0}
              title="Prerequisites"
              description="Make sure the following tools are installed on the machine that will run MySagra."
            />
            <div className="rounded-lg border p-5 text-sm space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 flex size-8 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 text-base">
                  🐳
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Docker (with Compose v2)</p>
                  <p className="text-muted-foreground">
                    MySagra runs entirely inside Docker containers. Install <strong className="text-foreground">Docker Desktop</strong> (Windows / macOS)
                    or <strong className="text-foreground">Docker Engine + Docker Compose</strong> (Linux) from the official site:
                  </p>
                  <a
                    href="https://docs.docker.com/get-docker/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sky-500 hover:underline font-medium"
                  >
                    docs.docker.com/get-docker →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              STEP 1 — Configure & generate files
          ══════════════════════════════════════════════════ */}
          <section>
            <StepHeader
              n={1}
              title="Configure your stack"
              description="Select the services you need. Copy each generated file (docker-compose.yml, .env, and nginx.conf if using Nginx) into a new folder on your server."
            />

            {/* ── SERVER_IP guidance ── */}
            <div className="mb-6 rounded-lg border border-sky-500/40 bg-sky-500/5 p-5 text-sm space-y-3">
              <p className="font-semibold text-foreground">Choosing the right <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">SERVER_IP</code></p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Private / local deployment</strong> — use your server&apos;s LAN IP address
                  (e.g.{' '}<InlineCode>192.168.1.100</InlineCode>). The self-signed certificate generated by mkcert in Step 2
                  will be valid exactly for that address.
                </li>
                <li>
                  <strong className="text-foreground">Public / internet-exposed deployment</strong> — point a real domain name to your
                  server and use a certificate issued by a trusted CA such as{' '}
                  <strong className="text-foreground">Cloudflare</strong>, Let&apos;s Encrypt, or similar.
                  This way browsers will trust the certificate automatically — no need to install a root CA on every device.
                </li>
              </ul>
            </div>

            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
              <span className="mt-0.5 text-amber-500 text-base leading-none"><TriangleAlert /></span>
              <p className="text-muted-foreground">
                Before copying the generated files, open the{' '}
                <strong className="text-foreground font-semibold">.env</strong> tab and set{' '}
                <InlineCode>SERVER_IP</InlineCode> to your server&apos;s actual IP address or hostname.
                This value is used both by the services at runtime and by{' '}
                <strong className="text-foreground font-semibold">mkcert</strong> in Step 2 to generate a certificate valid for that address.
              </p>
            </div>
            <DockerComposeGenerator />
            <div className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Expected folder structure after this step:</p>
              <CodeBlock label="your-server:~/mysagra/">{`mysagra/
├── docker-compose.yml
├── .env
├── nginx.conf          ← only if Nginx is selected
├── certs/              ← created in Step 2
│   ├── cert.pem
│   └── key.pem
└── rootCA.pem          ← created in Step 2`}</CodeBlock>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              STEP 2 — TLS certificates with mkcert
          ══════════════════════════════════════════════════ */}
          <section>
            <StepHeader
              n={2}
              title="Generate TLS certificates"
              description="Use mkcert to create a locally-trusted certificate for your server IP or domain and copy the root CA so the containers trust it."
            />

            <div className="space-y-6">

              {/* Install mkcert */}
              <div>
                <h3 className="text-base font-semibold mb-3">1 — Install mkcert</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Linux (apt)</p>
                    <CodeBlock label="bash">{`sudo apt install mkcert`}</CodeBlock>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-3">Linux / macOS (Homebrew)</p>
                    <CodeBlock label="bash">{`brew install mkcert`}</CodeBlock>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Windows (winget)</p>
                    <CodeBlock label="PowerShell">{`winget install FiloSottile.mkcert`}</CodeBlock>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-3">Windows (Scoop)</p>
                    <CodeBlock label="PowerShell">{`scoop install mkcert`}</CodeBlock>
                  </div>
                </div>
              </div>

              {/* Install local CA */}
              <div>
                <h3 className="text-base font-semibold mb-2">2 — Install the local CA</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  This makes your OS and browsers trust the certificate. Run once per machine.
                </p>
                <CodeBlock label="bash / PowerShell">{`mkcert -install`}</CodeBlock>
              </div>

              {/* Generate certs */}
              <div>
                <h3 className="text-base font-semibold mb-2">3 — Create the certs folder and generate the certificate</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Run from inside your <InlineCode>mysagra/</InlineCode> folder. Replace{' '}
                  <InlineCode>YOUR_SERVER_IP</InlineCode> with your actual IP or domain.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Linux / macOS</p>
                    <CodeBlock label="bash">{`mkdir -p certs
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 YOUR_SERVER_IP`}</CodeBlock>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Windows (PowerShell)</p>
                    <CodeBlock label="PowerShell">{`New-Item -ItemType Directory -Force -Path certs
mkcert -key-file certs\\key.pem -cert-file certs\\cert.pem localhost 127.0.0.1 YOUR_SERVER_IP`}</CodeBlock>
                  </div>
                </div>
              </div>

              {/* Copy rootCA */}
              <div>
                <h3 className="text-base font-semibold mb-2">4 — Copy rootCA.pem into the project folder</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  The containers need this file to trust the self-signed certificate internally.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Linux / macOS</p>
                    <CodeBlock label="bash">{`cp "$(mkcert -CAROOT)/rootCA.pem" ./rootCA.pem`}</CodeBlock>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Windows (PowerShell)</p>
                    <CodeBlock label="PowerShell">{`Copy-Item "$(mkcert -CAROOT)\\rootCA.pem" .\\rootCA.pem`}</CodeBlock>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              STEP 3 — Start the stack
          ══════════════════════════════════════════════════ */}
          <section>
            <StepHeader
              n={3}
              title="Start the stack"
              description="From your mysagra/ folder, bring all services up in detached mode."
            />
            <CodeBlock label="bash / PowerShell">{`docker compose up -d`}</CodeBlock>
            <p className="mt-4 text-sm text-muted-foreground">
              On first boot MySagra will run database migrations automatically. Check the logs with{' '}
              <InlineCode>docker compose logs -f mysagra-backend</InlineCode>.
            </p>

            {/* ── Service URLs ── */}
            <div className="mt-8 space-y-3">
              <h3 className="text-base font-semibold">Where to find the services</h3>
              <p className="text-sm text-muted-foreground">
                Once the stack is running, replace <InlineCode>SERVER_IP</InlineCode> with your actual IP or domain:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-6 text-left font-semibold">Service</th>
                      <th className="py-2 text-left font-semibold">URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-muted-foreground">
                    <tr>
                      <td className="py-2 pr-6">MyCassa</td>
                      <td className="py-2"><InlineCode>https://SERVER_IP</InlineCode> (port 443)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">Admin panel (MyAmministratore)</td>
                      <td className="py-2"><InlineCode>https://SERVER_IP:81</InlineCode></td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">MyStampa</td>
                      <td className="py-2"><InlineCode>https://SERVER_IP:3032</InlineCode></td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">MyNumeri</td>
                      <td className="py-2"><InlineCode>https://SERVER_IP:3033</InlineCode></td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">MyClienti</td>
                      <td className="py-2"><InlineCode>https://SERVER_IP:3034</InlineCode></td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">DBGate</td>
                      <td className="py-2"><InlineCode>http://SERVER_IP:3000</InlineCode></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Trust the certificate on local PCs ── */}
            <div className="mt-8 space-y-4">
              <h3 className="text-base font-semibold">Trust the certificate on local devices</h3>
              <p className="text-sm text-muted-foreground">
                For a private LAN deployment using a self-signed certificate, every device that needs to access MySagra
                must trust the <InlineCode>rootCA.pem</InlineCode> you generated in Step 2.
                Copy <InlineCode>rootCA.pem</InlineCode> from your server to the target machine, then install it:
              </p>

              {/* Windows */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Windows</p>
                <CodeBlock label="PowerShell (run as Administrator)">{`Import-Certificate -FilePath .\\rootCA.pem -CertStoreLocation Cert:\\LocalMachine\\Root`}</CodeBlock>
                <p className="mt-2 text-xs text-muted-foreground">
                  Alternatively, double-click <InlineCode>rootCA.pem</InlineCode>, choose <em>Install Certificate</em> →
                  {' '}<em>Local Machine</em> → <em>Trusted Root Certification Authorities</em>.
                </p>
              </div>

              {/* macOS */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">macOS</p>
                <CodeBlock label="bash">{`sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain rootCA.pem`}</CodeBlock>
              </div>

              {/* Linux */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Linux (Debian / Ubuntu)</p>
                <CodeBlock label="bash">{`sudo cp rootCA.pem /usr/local/share/ca-certificates/mysagra-rootCA.crt
sudo update-ca-certificates`}</CodeBlock>
              </div>

              {/* Android / iOS hint */}
              <p className="text-sm text-muted-foreground">
                On <strong className="text-foreground">Android</strong> go to{' '}
                <em>Settings → Security → Install a certificate → CA certificate</em> and select{' '}
                <InlineCode>rootCA.pem</InlineCode>. On <strong className="text-foreground">iOS / iPadOS</strong>{' '}
                AirDrop or email yourself the file, tap it to install, then go to{' '}
                <em>Settings → General → VPN &amp; Device Management → Certificate Trust Settings</em> and enable full trust.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              STEP 4 — Create API Keys
          ══════════════════════════════════════════════════ */}
          <section>
            <StepHeader
              n={4}
              title="Create API keys"
              description="Certain services authenticate with the API via API key. Create them in the admin panel before those services can connect."
            />

            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
              <span className="mt-0.5 text-amber-500 text-base leading-none"><TriangleAlert /></span>
              <p className="text-muted-foreground">
                MyStampa and MyClienti will fail to authenticate with the API until you create and register their API keys.
                The <strong className="text-foreground font-semibold">.env</strong> file pre-generates placeholder values in Step 1,
                but you must create matching keys in the admin panel before the services will work.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-3">How to create API keys</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Open the admin panel</strong> at{' '}
                    <InlineCode>https://SERVER_IP:81</InlineCode> and log in after Step 3 has completed.
                  </li>
                  <li>
                    <strong className="text-foreground">Navigate to Settings → API Keys → New key</strong>.
                  </li>
                  <li>
                    <strong className="text-foreground">For MyStampa:</strong> select type <InlineCode>PRINTER</InlineCode>,
                    {' '} name it <InlineCode>MyStampa</InlineCode>, and click Create.
                  </li>
                  <li>
                    <strong className="text-foreground">Copy the generated key</strong> (starts with <InlineCode>ms_pt_</InlineCode>)
                    {' '} and paste it into your <InlineCode>.env</InlineCode> file as the value for{' '}
                    <InlineCode>MYSTAMPA_API_KEY</InlineCode>.
                  </li>
                  <li>
                    <strong className="text-foreground">Repeat for MyClienti:</strong> create a <InlineCode>WEBAPP</InlineCode> type
                    {' '} key named <InlineCode>MyClienti</InlineCode>, copy the <InlineCode>ms_wb_</InlineCode> key,
                    {' '} and paste into <InlineCode>MYCLIENTI_API_KEY</InlineCode>.
                  </li>
                  <li>
                    <strong className="text-foreground">Restart the affected services:</strong>
                  </li>
                </ol>
                <div className="mt-3">
                  <CodeBlock label="bash / PowerShell">
                    docker compose restart mystampa myclienti
                  </CodeBlock>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> The <InlineCode>.env</InlineCode> tab in Step 1 pre-generates
                {' '} placeholder values for <InlineCode>MYSTAMPA_API_KEY</InlineCode> and <InlineCode>MYCLIENTI_API_KEY</InlineCode>.
                {' '} You can replace them with the real keys after creating them in the admin panel, or regenerate the placeholders
                {' '} if you prefer to use different values.
              </p>
            </div>
          </section>

        </div>
      </Wrapper>
    )
  }

  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode
  } = await importPage(params.mdxPath)
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}