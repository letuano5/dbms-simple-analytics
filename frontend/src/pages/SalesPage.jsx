import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '../services/api'
import { LineChart, BarChart } from '../components/charts/BaseChart'
import GranularityToggle from '../components/GranularityToggle'
import PageHeader from '../components/layout/PageHeader'

export default function SalesPage() {
  const [granularity, setGranularity] = useState('month')

  const { data: revenue } = useQuery({
    queryKey: ['sales-revenue', granularity],
    queryFn: () => salesApi.revenue(granularity).then(r => r.data),
  })
  const { data: byPL } = useQuery({
    queryKey: ['sales-by-pl'],
    queryFn: () => salesApi.byProductLine().then(r => r.data),
  })
  const { data: reps } = useQuery({
    queryKey: ['sales-reps'],
    queryFn: () => salesApi.repPerformance().then(r => r.data),
  })

  return (
    <div>
      <PageHeader title="Doanh số" subtitle="Phân tích doanh thu và hiệu suất bán hàng" />

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Doanh thu theo thời gian</h2>
          <GranularityToggle value={granularity} onChange={setGranularity} />
        </div>
        {revenue?.length > 0
          ? <LineChart data={revenue} xKey="period" yKey="revenue" title="Doanh thu" color="#10b981" areaFill />
          : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Doanh thu theo dòng sản phẩm</h2>
          {byPL?.length > 0
            ? <BarChart data={byPL} xKey="productLine" yKey="revenue" title="Doanh thu" color="#8b5cf6" />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Hiệu suất Sales Rep</h2>
          {reps?.length > 0
            ? <BarChart data={[...reps].reverse()} xKey="employeeName" yKey="totalRevenue" horizontal title="Doanh thu" color="#f59e0b" />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
      </div>
    </div>
  )
}
