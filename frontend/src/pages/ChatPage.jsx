import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../services/api'
import ReactMarkdown from 'react-markdown'
import { Send, ChevronDown, ChevronRight, Bot, User, Loader2, X, Sparkles } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'

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
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors">
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
            {columns.map(c => <th key={c} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 whitespace-nowrap">
                  {cell === null ? <span className="text-gray-300">NULL</span>
                   : typeof cell === 'number' ? cell.toLocaleString('vi-VN')
                   : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t">... và {rows.length - 50} dòng nữa</div>}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        {isUser ? (
          <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
            {msg.content}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            {msg.error ? (
              <div className="text-red-500 text-sm">{msg.error}</div>
            ) : (
              <>
                {msg.explanation && (
                  <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.explanation}</ReactMarkdown>
                  </div>
                )}
                {msg.sql && <SqlBlock sql={msg.sql} />}
                {msg.columns && <ResultTable columns={msg.columns} rows={msg.rows} />}
                {msg.row_count != null && (
                  <div className="mt-2 text-xs text-gray-400">{msg.row_count} dòng kết quả</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
          <User size={14} className="text-gray-600" />
        </div>
      )}
    </div>
  )
}

function SuggestionsFloat({ onSelect }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              Gợi ý câu hỏi
            </span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { onSelect(s); setOpen(false) }}
                className="text-left text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors border border-blue-100 leading-snug"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Gợi ý câu hỏi"
      >
        <Bot size={22} className="text-white" />
      </button>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      explanation: 'Xin chào! Tôi là AI assistant cho ClassicModels. Hãy hỏi tôi bất kỳ câu hỏi nào về dữ liệu — tôi sẽ tự động sinh SQL và trả kết quả thực tế từ database.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(question) {
    const q = question || input.trim()
    if (!q || loading) return
    setInput('')
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
    <div className="flex flex-col h-full">
      <PageHeader title="AI Chat" subtitle="Hỏi bất kỳ câu hỏi về dữ liệu — AI tự sinh SQL và trả kết quả" />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <Loader2 size={14} className="text-white animate-spin" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-gray-400 italic">
              Đang phân tích và truy vấn...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4 shrink-0">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Nhập câu hỏi về dữ liệu..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Send size={14} />
            Gửi
          </button>
        </div>
      </div>

      <SuggestionsFloat onSelect={q => { setInput(q); handleSend(q) }} />
    </div>
  )
}
