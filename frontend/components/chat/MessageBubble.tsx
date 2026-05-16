'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import SourceCitation from './SourceCitation'

export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  sources?: any[]
}

interface Props {
  message: Message
  userName: string
}

export default function MessageBubble({ message, userName }: Props) {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (message.role === 'user') {
    return (
      <div className="flex items-start gap-3 flex-row-reverse">
        <div className="w-8 h-8 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[#0EA5E9] text-xs font-semibold">{initials}</span>
        </div>
        <div className="max-w-[75%]">
          <p className="text-theme-muted text-xs mb-1 text-right">You</p>
          <div className="bg-[#0EA5E9] text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-[#0EA5E9]/10 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm">🎓</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-theme-muted text-xs mb-2">ScholarAI</p>
        <div className="text-theme-text text-sm leading-relaxed space-y-2">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-theme-text">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-3 text-theme-text">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-3 text-theme-text">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                if (isBlock) {
                  return (
                    <pre className="bg-theme-bg rounded-xl p-4 overflow-x-auto mb-3 border border-theme-border">
                      <code className="text-sm text-theme-text">{children}</code>
                    </pre>
                  )
                }
                return (
                  <code className="bg-theme-bg border border-theme-border px-1.5 py-0.5 rounded text-xs">
                    {children}
                  </code>
                )
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#0EA5E9] pl-4 italic text-theme-muted mb-3">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <SourceCitation sources={message.sources || []} />
      </div>
    </div>
  )
}