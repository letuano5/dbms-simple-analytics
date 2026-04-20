import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../services/api'
import ReactMarkdown from 'react-markdown'
import {
  Send, ChevronDown, ChevronRight, Bot, User,
  Loader2, X, Sparkles, Minus,
} from 'lucide-react'

const SUGGESTIONS = [
  'Top 5 khách hàng có doanh thu cao nhất?',
  'Doanh thu theo từng tháng trong năm 2004?',
  'Sản phẩm nào bán được nhiều nhất?',
  'Đơn hàng nào bị hủy trong năm 2003?',
  'Sales rep nào có hiệu suất tốt nhất?',
  'Tỷ lệ đơn hàng theo trạng thái?',
]

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Xem SQL
      </button>
      {open && (
        <pre className="p-3 bg-gray-900 text-green-400 overflow-x-auto text-xs leading-relaxed">
          {sql}
        </pre>
      )}
    </div>
  )
}

function ResultTable({ columns, rows }) {
  if (!columns?.length) return null
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
      <table className="text-xs w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 whitespace-nowrap">
                  {cell === null
                    ? <span className="text-gray-300">NULL</span>
                    : typeof cell === 'number'
                      ? cell.toLocaleString('vi-VN')
                      : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t">
          ... và {rows.length - 50} dòng nữa
        </div>
      )}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
          <Bot size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        {isUser ? (
          <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-tr-sm text-sm">
            {msg.content}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
            {msg.error ? (
              <div className="text-red-500 text-xs">{msg.error}</div>
            ) : (
              <>
                {msg.explanation && (
                  <div className="text-xs text-gray-700 prose prose-xs max-w-none">
                    <ReactMarkdown>{msg.explanation}</ReactMarkdown>
                  </div>
                )}
                {msg.sql && <SqlBlock sql={msg.sql} />}
                {msg.columns && <ResultTable columns={msg.columns} rows={msg.rows} />}
                {msg.row_count != null && (
                  <div className="mt-1.5 text-xs text-gray-400">{msg.row_count} dòng kết quả</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
          <User size={12} className="text-gray-600" />
        </div>
      )}
    </div>
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      explanation: 'Xin chào! Hỏi tôi bất kỳ câu hỏi nào về dữ liệu ClassicModels — tôi sẽ tự sinh SQL và trả kết quả thực tế.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSend(question) {
    const q = question || input.trim()
    if (!q || loading) return
    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await chatApi.send(q)
      setMessages(prev => [...prev, { role: 'assistant', ...res.data }])
    } catch (e) {
      const errMsg = e.response?.data?.detail ?? 'Đã xảy ra lỗi. Vui lòng thử lại.'
      setMessages(prev => [...prev, { role: 'assistant', error: errMsg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[420px] h-[580px] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-white" />
              <span className="text-white font-semibold text-sm">AI Chat</span>
              <span className="text-blue-200 text-xs">· ClassicModels</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded transition-colors"
                title="Thu nhỏ"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded transition-colors"
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Loader2 size={12} className="text-white animate-spin" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm text-xs text-gray-400 italic">
                  Đang phân tích và truy vấn...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions popup */}
          {showSuggestions && (
            <div className="mx-3 mb-2 bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Sparkles size={11} className="text-blue-500" />
                Gợi ý câu hỏi
              </div>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 px-3 py-2.5 bg-white shrink-0 flex gap-2">
            <button
              onClick={() => setShowSuggestions(v => !v)}
              className={`shrink-0 p-2 rounded-xl transition-colors ${showSuggestions ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              title="Gợi ý"
            >
              <Sparkles size={15} />
            </button>
            <input
              ref={inputRef}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              placeholder="Nhập câu hỏi về dữ liệu..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="shrink-0 p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 w-13 h-13 w-[52px] h-[52px] rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="AI Chat"
      >
        {open
          ? <X size={20} className="text-white" />
          : <Bot size={22} className="text-white" />
        }
      </button>
    </>
  )
}
