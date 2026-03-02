'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: string
  label?: string
}

export function CodeBlock({ children, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'relative border bg-neutral-950 overflow-hidden text-sm group'
      )}
    >
      {label && (
        <div className="px-4 py-1.5 text-xs text-neutral-400 border-b border-neutral-800 font-mono">
          {label}
        </div>
      )}

      <button
        onClick={handleCopy}
        aria-label="Copy code"
        className={cn(
          'absolute top-2 right-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all',
          'bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100',
          'hover:bg-neutral-700 hover:text-neutral-100',
          'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500',
          label && 'top-9',
        )}
      >
        {copied ? (
          <>
            <Check className="size-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3" />
            Copy
          </>
        )}
      </button>

      <div className="p-4 overflow-x-auto text-neutral-100 font-mono whitespace-pre bg-yellow-500/10">
        {children}
      </div>
    </div>
  )
}
