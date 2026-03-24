import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type PanelMode = 'hidden' | 'side' | 'full'

interface ChatPanelProps {
  /** All known component IDs so we can make them clickable */
  componentIds: string[]
  /** Called when user clicks a component name inside a chat message */
  onComponentClick: (componentId: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  'What sensors have failed?',
  'What is the root cause?',
  'Who should be notified?',
  'Show degree centrality rankings',
]

const mono = { fontFamily: "'JetBrains Mono', monospace" }

// ---------------------------------------------------------------------------
// Component name linker
// ---------------------------------------------------------------------------

/** Replace known component IDs in text with clickable spans. */
function LinkedMessage({
  content,
  componentIds,
  onComponentClick,
}: {
  content: string
  componentIds: string[]
  onComponentClick: (id: string) => void
}) {
  // Build a lookup set with display names mapped to real IDs
  const idSet = new Map<string, string>()
  for (const id of componentIds) {
    idSet.set(id.toLowerCase(), id)
    idSet.set(id.replace(/_/g, ' ').toLowerCase(), id)
  }

  return (
    <ReactMarkdown
      components={{
        // Override paragraph to inject component links
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{linkifyChildren(children, idSet, onComponentClick)}</p>
        ),
        li: ({ children }) => (
          <li className="mb-1">{linkifyChildren(children, idSet, onComponentClick)}</li>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <pre className="bg-bg-primary rounded px-3 py-2 overflow-x-auto my-2 text-xs" style={mono}>
                <code>{children}</code>
              </pre>
            )
          }
          return (
            <code
              className="bg-bg-primary px-1.5 py-0.5 rounded text-accent-cyan text-xs"
              style={mono}
            >
              {children}
            </code>
          )
        },
        strong: ({ children }) => (
          <strong className="font-semibold text-text-primary">{children}</strong>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="w-full text-xs border-collapse" style={mono}>
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-2 py-1.5 border-b border-border-subtle text-text-tertiary font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1.5 border-b border-border-subtle/50 text-text-secondary">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function linkifyChildren(
  children: React.ReactNode,
  idSet: Map<string, string>,
  onClick: (id: string) => void
): React.ReactNode {
  if (!children) return children

  const processText = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    // Build regex from component names, longest first to avoid partial matches
    const names = Array.from(idSet.keys()).sort((a, b) => b.length - a.length)
    if (names.length === 0) {
      parts.push(text)
      return parts
    }
    const pattern = new RegExp(
      `\\b(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
      'gi'
    )

    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      const realId = idSet.get(match[0].toLowerCase())
      if (realId) {
        parts.push(
          <button
            key={`${realId}-${match.index}`}
            onClick={() => onClick(realId)}
            className="inline text-accent-cyan hover:text-accent-blue underline underline-offset-2 decoration-accent-cyan/40 hover:decoration-accent-blue transition-colors cursor-pointer"
            style={mono}
          >
            {match[0]}
          </button>
        )
      } else {
        parts.push(match[0])
      }
      lastIndex = pattern.lastIndex
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    return parts
  }

  if (typeof children === 'string') {
    return <>{processText(children)}</>
  }

  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, i) => {
          if (typeof child === 'string') {
            return <span key={i}>{processText(child)}</span>
          }
          return child
        })}
      </>
    )
  }

  return children
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-text-tertiary ml-2">Querying ontology...</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatPanel({
  componentIds,
  onComponentClick,
}: ChatPanelProps) {
  const [mode, setMode] = useState<PanelMode>('hidden')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (mode !== 'hidden') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [mode])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return

      const userMsg: ChatMessage = { role: 'user', content: content.trim() }
      const newMessages = [...messages, userMsg]
      setMessages(newMessages)
      setInput('')
      setLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(err.detail || `API error: ${res.status}`)
        }

        const data = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: data.content }])
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Something went wrong'
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `**Error:** ${errorMsg}` },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, loading]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleOpen = () => {
    setMode('side')
    setHasBeenOpened(true)
  }

  const handleComponentClickInChat = (componentId: string) => {
    if (mode === 'full') {
      setMode('side')
      setTimeout(() => onComponentClick(componentId), 350)
    } else {
      onComponentClick(componentId)
    }
  }

  // ---- Floating button (hidden mode) ----
  if (mode === 'hidden') {
    return createPortal(
      <motion.button
        onClick={handleOpen}
        className="fixed right-5 top-1/2 -translate-y-1/2 z-[9999] w-12 h-12 rounded-full bg-accent-blue flex items-center justify-center shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40 hover:scale-110 transition-all duration-200"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        title="Ask the Digital Twin"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        {/* Pulse ring on first load */}
        {!hasBeenOpened && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-accent-blue"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>,
      document.body
    )
  }

  // ---- Panel (side or full) ----
  const isFull = mode === 'full'

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="chat-panel"
        initial={{ x: isFull ? 0 : 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed top-0 right-0 z-[9999] h-full flex flex-col ${
          isFull ? 'w-full' : 'w-[400px]'
        }`}
        style={{
          backgroundColor: isFull ? 'var(--color-bg-primary)' : undefined,
        }}
      >
        {/* Backdrop blur strip for side panel mode */}
        {!isFull && (
          <div
            className="absolute inset-0 bg-bg-primary/95 backdrop-blur-sm border-l border-border-subtle"
            style={{ zIndex: -1 }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent-blue/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-blue" />
            </div>
            <span
              className="text-sm font-semibold text-text-primary"
              style={mono}
            >
              Digital Twin Assistant
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isFull ? (
              <button
                onClick={() => setMode('side')}
                className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                title="Collapse to side panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setMode('full')}
                className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                title="Expand to full screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMode('hidden')}
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('hidden')}
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !loading ? (
            <EmptyState onSuggestionClick={sendMessage} />
          ) : (
            <div className={`flex flex-col gap-3 ${isFull ? 'max-w-3xl mx-auto' : ''}`}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent-blue text-white rounded-br-sm'
                        : 'bg-bg-card border border-border-subtle text-text-secondary rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <LinkedMessage
                        content={msg.content}
                        componentIds={componentIds}
                        onComponentClick={handleComponentClickInChat}
                      />
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-border-subtle bg-bg-secondary/80 backdrop-blur-sm p-3">
          <div className={`flex gap-2 ${isFull ? 'max-w-3xl mx-auto' : ''}`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the engine..."
              rows={1}
              className="flex-1 bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-accent-blue/50 transition-colors"
              style={mono}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="px-3 py-2.5 bg-accent-blue rounded-lg text-white hover:bg-accent-blue/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (msg: string) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-accent-blue/60" />
        </div>
        <p className="text-text-secondary text-sm mb-1 font-medium">
          Ask me about the engine
        </p>
        <p className="text-text-tertiary text-xs mb-6">
          I can query the Prometheux ontology in real time
        </p>
        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="text-left px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary hover:border-accent-blue/30 transition-all duration-200"
              style={mono}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
