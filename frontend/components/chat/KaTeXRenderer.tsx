'use client'

import { useEffect, useRef } from 'react'

interface Props {
  math: string
  block?: boolean
}

export default function KaTeXRenderer({ math, block = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const render = async () => {
      const katex = (await import('katex')).default
      if (ref.current) {
        katex.render(math, ref.current, {
          throwOnError: false,
          displayMode: block,
        })
      }
    }
    render()
  }, [math, block])

  return (
    <span
      ref={ref}
      className={block ? 'block text-center my-4 overflow-x-auto' : 'inline'}
    />
  )
}