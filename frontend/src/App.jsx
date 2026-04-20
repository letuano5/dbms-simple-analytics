import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import CustomersPage from './pages/CustomersPage'
import OrdersPage from './pages/OrdersPage'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import PivotPage from './pages/PivotPage'
import ChatWidget from './components/ChatWidget'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/pivot" element={<PivotPage />} />
            </Routes>
          </main>
        </div>
        <ChatWidget />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
