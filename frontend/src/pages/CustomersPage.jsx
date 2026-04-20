import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '../services/api'
import { BarChart, PieChart } from '../components/charts/BaseChart'
import DataTable from '../components/tables/DataTable'
import PageHeader from '../components/layout/PageHeader'
import { Search } from 'lucide-react'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)

  const { data: top } = useQuery({ queryKey: ['customers-top'], queryFn: () => customersApi.top(10).then(r => r.data) })
  const { data: byCountry } = useQuery({ queryKey: ['customers-country'], queryFn: () => customersApi.byCountry().then(r => r.data) })
  const { data: list, isLoading } = useQuery({
    queryKey: ['customers-list', search, country, page],
    queryFn: () => customersApi.list({ search, country, page, limit: 15 }).then(r => r.data),
  })

  const columns = [
    { key: 'customerNumber', label: '#', render: v => <span className="text-gray-400 text-xs">{v}</span> },
    { key: 'customerName', label: 'Tên khách hàng', render: v => <span className="font-medium">{v}</span> },
    { key: 'country', label: 'Quốc gia' },
    { key: 'city', label: 'Thành phố' },
    { key: 'creditLimit', label: 'Hạn mức tín dụng', render: v => v ? `$${Number(v).toLocaleString()}` : '—' },
    { key: 'totalRevenue', label: 'Doanh thu', render: v => <span className="font-semibold text-blue-600">${Number(v).toLocaleString()}</span> },
  ]

  return (
    <div>
      <PageHeader title="Khách hàng" subtitle="Tra cứu và thống kê khách hàng" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 10 khách hàng theo doanh thu</h2>
          {top?.length > 0
            ? <BarChart data={[...top].reverse()} xKey="customerName" yKey="totalRevenue" horizontal title="Doanh thu" color="#3b82f6" />
            : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Phân bố theo quốc gia</h2>
          {byCountry?.length > 0
            ? <PieChart data={byCountry.slice(0, 10)} nameKey="country" valueKey="count" title="Quốc gia" />
            : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 w-full" placeholder="Tìm khách hàng..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <input className="input w-40" placeholder="Quốc gia..." value={country} onChange={e => { setCountry(e.target.value); setPage(1) }} />
        </div>
        <DataTable
          columns={columns}
          data={list?.data ?? []}
          total={list?.total ?? 0}
          page={page}
          limit={15}
          onPageChange={setPage}
          loading={isLoading}
        />
      </div>
    </div>
  )
}
