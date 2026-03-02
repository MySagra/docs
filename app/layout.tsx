import AutoRefresh from '@/app/_components/autoRefresh'
import { DocsLayout, head } from '@/app/_components/nextra-theme'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: 'MySagra Docs',
  description: 'La documentazione ufficiale di MySagra',
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AutoRefresh>
      <html lang="it" dir="ltr" suppressHydrationWarning>
        {head}
        <body>
          <DocsLayout>{children}</DocsLayout>
        </body>
      </html>
    </AutoRefresh>
  )
}