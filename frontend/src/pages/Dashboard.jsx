import { useQuery } from '@tanstack/react-query'
import { dashboardApi, salesApi, ordersApi } from '../services/api'
import { LineChart, PieChart } from '../components/charts/BaseChart'
import PageHeader from '../components/layout/PageHeader'
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react'

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-xl font-bold text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: kpis } = useQuery({ queryKey: ['kpis'], queryFn: () => dashboardApi.kpis().then(r => r.data) })
  const { data: revenue } = useQuery({ queryKey: ['revenue', 'month'], queryFn: () => salesApi.revenue('month').then(r => r.data) })
  const { data: statusDist } = useQuery({ queryKey: ['status-dist'], queryFn: () => ordersApi.statusDistribution().then(r => r.data) })

  const fmt = (n) => n?.toLocaleString('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) ?? '—'

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Tổng quan hệ thống ClassicModels" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard icon={DollarSign} label="Tổng doanh thu" value={fmt(kpis?.totalRevenue)} color="bg-blue-500" />
        <KpiCard icon={ShoppingCart} label="Tổng đơn hàng" value={kpis?.totalOrders?.toLocaleString() ?? '—'} color="bg-emerald-500" />
        <KpiCard icon={Users} label="Khách hàng" value={kpis?.totalCustomers?.toLocaleString() ?? '—'} color="bg-violet-500" />
        <KpiCard icon={Package} label="Sản phẩm" value={kpis?.totalProducts?.toLocaleString() ?? '—'} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Doanh thu theo tháng</h2>
          {revenue?.length > 0
            ? <LineChart data={revenue} xKey="period" yKey="revenue" title="Doanh thu" color="#3b82f6" areaFill />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Trạng thái đơn hàng</h2>
          {statusDist?.length > 0
            ? <PieChart data={statusDist} nameKey="status" valueKey="count" title="Trạng thái" />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
      </div>
    </div>
  )
}
