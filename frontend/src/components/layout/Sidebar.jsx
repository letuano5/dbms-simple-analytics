import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShoppingCart, TrendingUp,
  Package, TableProperties
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Khách hàng' },
  { to: '/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/sales', icon: TrendingUp, label: 'Doanh số' },
  { to: '/products', icon: Package, label: 'Sản phẩm' },
  { to: '/pivot', icon: TableProperties, label: 'Pivot' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="text-sm font-bold text-blue-400 tracking-wider uppercase">ClassicModels</div>
        <div className="text-xs text-gray-400 mt-0.5">Analytics Dashboard</div>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        MySQL · classicmodels
      </div>
    </aside>
  )
}
