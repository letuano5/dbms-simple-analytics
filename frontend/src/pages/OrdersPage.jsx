import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ordersApi } from '../services/api'
import { LineChart, PieChart } from '../components/charts/BaseChart'
import DataTable from '../components/tables/DataTable'
import GranularityToggle from '../components/GranularityToggle'
import PageHeader from '../components/layout/PageHeader'
import { Search } from 'lucide-react'

const STATUS_COLORS = {
  Shipped: '#10b981', Resolved: '#3b82f6', Cancelled: '#ef4444',
  'On Hold': '#f59e0b', Disputed: '#8b5cf6', 'In Process': '#06b6d4',
}

const STATUS_OPTIONS = ['', 'Shipped', 'Resolved', 'Cancelled', 'On Hold', 'Disputed', 'In Process']

export default function OrdersPage() {
  const [granularity, setGranularity] = useState('month')
  const [customerSearch, setCustomerSearch] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('orderDate')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  const { data: overTime } = useQuery({
    queryKey: ['orders-over-time', granularity],
    queryFn: () => ordersApi.overTime(granularity).then(r => r.data),
  })
  const { data: statusDist } = useQuery({
    queryKey: ['status-dist'],
    queryFn: () => ordersApi.statusDistribution().then(r => r.data),
  })
  const { data: list, isLoading } = useQuery({
    queryKey: ['orders-list', customerSearch, status, fromDate, toDate, sortBy, sortDir, page],
    queryFn: () => ordersApi.list({
      customer_search: customerSearch,
      status, from_date: fromDate, to_date: toDate,
      page, limit: 15,
      sort_by: sortBy, sort_dir: sortDir,
    }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  function handleSort(key, dir) {
    setSortBy(key)
    setSortDir(dir)
    setPage(1)
  }

  function reset(setter) {
    return (e) => { setter(e.target.value); setPage(1) }
  }

  const columns = [
    { key: 'orderNumber', label: '#' },
    { key: 'customerName', label: 'Khách hàng', render: v => <span className="font-medium">{v}</span> },
    { key: 'orderDate', label: 'Ngày đặt' },
    { key: 'requiredDate', label: 'Cần giao' },
    { key: 'shippedDate', label: 'Đã giao' },
    {
      key: 'status', label: 'Trạng thái',
      render: v => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: STATUS_COLORS[v] + '20', color: STATUS_COLORS[v] ?? '#666' }}>
          {v}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Đơn hàng" subtitle="Theo dõi và phân tích đơn hàng" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Số đơn & doanh thu theo thời gian</h2>
            <GranularityToggle value={granularity} onChange={setGranularity} />
          </div>
          {overTime?.length > 0
            ? <LineChart data={overTime} xKey="period" yKey="revenue" title="Doanh thu" color="#3b82f6" areaFill />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Phân bố trạng thái</h2>
          {statusDist?.length > 0
            ? <PieChart data={statusDist} nameKey="status" valueKey="count" title="Trạng thái" />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Tìm khách hàng</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 w-44"
                placeholder="Tên khách hàng..."
                value={customerSearch}
                onChange={reset(setCustomerSearch)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Trạng thái</label>
            <select className="input w-40" value={status} onChange={reset(setStatus)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'Tất cả'}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Ngày đặt</label>
            <div className="flex items-center gap-1.5">
              <input type="date" className="input" value={fromDate} onChange={reset(setFromDate)} />
              <span className="text-gray-400 text-sm">→</span>
              <input type="date" className="input" value={toDate} onChange={reset(setToDate)} />
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
