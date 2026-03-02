import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Logo } from './logo'

/*
 * Colore primario del tema MySagra:
 *   oklch(0.795 0.184 86.047) → HSL ≈ hue 46°, saturation 90%, lightness 55%
 *   (oro / ambra)
 */

export const banner = (
  <Banner storageKey="mysagra-1.4.0">
    MySagra 1.4.0 is released 🎉
  </Banner>
)

export const navbar = (
  <Navbar
    logo={
      <span style={{ fontWeight: 800, fontSize: '1.1rem' }} className='flex flex-row gap-0.5 items-center'>
        <Logo className='w-8' /> MySagra
      </span>
    }
    projectLink="https://github.com/MySagra"
  >
  </Navbar>
)

export const footer = (
  <Footer>
    <p style={{ fontSize: '0.875rem' }}>
      AGPL-3.0 {new Date().getFullYear()} © MySagra.
    </p>
  </Footer>
)

export const head = (
  <Head
    color={{
      hue: { dark: 46, light: 46 },
      saturation: { dark: 90, light: 90 },
      lightness: { dark: 55, light: 45 },
    }}
    backgroundColor={{
      dark: 'rgb(15,15,20)',
      light: 'rgb(255,255,255)',
    }}
  />
)

export async function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout
      banner={banner}
      navbar={navbar}
      pageMap={await getPageMap()}
      footer={footer}
      nextThemes={{ defaultTheme: 'system' }}
      feedback={{ labels: 'feedback', link: 'https://github.com/MySagra/mysagra/issues' }}
      editLink={null}
      sidebar={{ defaultMenuCollapseLevel: 2 }}
      toc={{ title: 'In questa pagina' }}
    >
      {children}
    </Layout>
  )
}
