import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { customersApi } from '../services/api'
import { BarChart, PieChart } from '../components/charts/BaseChart'
import DataTable from '../components/tables/DataTable'
import PageHeader from '../components/layout/PageHeader'
import { Search } from 'lucide-react'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [creditMin, setCreditMin] = useState('')
  const [creditMax, setCreditMax] = useState('')
  const [sortBy, setSortBy] = useState('customerName')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const { data: top } = useQuery({ queryKey: ['customers-top'], queryFn: () => customersApi.top(10).then(r => r.data) })
  const { data: byCountry } = useQuery({ queryKey: ['customers-country'], queryFn: () => customersApi.byCountry().then(r => r.data) })
  const { data: list, isLoading } = useQuery({
    queryKey: ['customers-list', search, country, creditMin, creditMax, sortBy, sortDir, page],
    queryFn: () => customersApi.list({
      search, country, page, limit: 15,
      sort_by: sortBy, sort_dir: sortDir,
      credit_limit_min: creditMin || undefined,
      credit_limit_max: creditMax || undefined,
    }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const countries = byCountry ? [...byCountry].sort((a, b) => a.country.localeCompare(b.country)) : []

  function handleSort(key, dir) {
    setSortBy(key)
    setSortDir(dir)
    setPage(1)
  }

  function reset(setter) {
    return (e) => { setter(e.target.value); setPage(1) }
  }

  const columns = [
    { key: 'customerNumber', label: '#', sortable: false, render: v => <span className="text-gray-400 text-xs">{v}</span> },
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
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Tìm theo tên</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 w-48"
                placeholder="Tìm khách hàng..."
                value={search}
                onChange={reset(setSearch)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Quốc gia</label>
            <select className="input w-40" value={country} onChange={reset(setCountry)}>
              <option value="">Tất cả</option>
              {countries.map(c => <option key={c.country} value={c.country}>{c.country}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Hạn mức tín dụng ($)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" className="input w-24" placeholder="Min"
                value={creditMin} onChange={reset(setCreditMin)}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number" min="0" className="input w-24" placeholder="Max"
                value={creditMax} onChange={reset(setCreditMax)}
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={list?.data ?? []}
          total={list?.total ?? 0}
          page={page}
          limit={15}
          onPageChange={setPage}
          loading={isLoading}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>
    </div>
  )
}
