import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, data, total, page, limit, onPageChange, loading }) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="table-header px-4 py-3 text-left whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">Không có dữ liệu</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="table-row">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
          <span className="text-xs text-gray-500">
            {total} kết quả · Trang {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
