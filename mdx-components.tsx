import type { ComponentType } from 'react'
import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'

type MDXComponents = Record<string, ComponentType<any>>

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...getThemeComponents({}),
    ...components,
  }
}
