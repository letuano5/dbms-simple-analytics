import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { productsApi } from '../services/api'
import { BarChart } from '../components/charts/BaseChart'
import DataTable from '../components/tables/DataTable'
import PageHeader from '../components/layout/PageHeader'
import { Search } from 'lucide-react'

const PRODUCT_LINES = ['', 'Classic Cars', 'Motorcycles', 'Planes', 'Ships', 'Trains', 'Trucks and Buses', 'Vintage Cars']

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [productLine, setProductLine] = useState('')
  const [qtyMin, setQtyMin] = useState('')
  const [qtyMax, setQtyMax] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortBy, setSortBy] = useState('productName')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const { data: top } = useQuery({ queryKey: ['products-top'], queryFn: () => productsApi.topSelling(10).then(r => r.data) })
  const { data: stock } = useQuery({ queryKey: ['stock-levels'], queryFn: () => productsApi.stockLevels().then(r => r.data) })
  const { data: list, isLoading } = useQuery({
    queryKey: ['products-list', search, productLine, qtyMin, qtyMax, priceMin, priceMax, sortBy, sortDir, page],
    queryFn: () => productsApi.list({
      search, product_line: productLine, page, limit: 15,
      sort_by: sortBy, sort_dir: sortDir,
      qty_min: qtyMin || undefined,
      qty_max: qtyMax || undefined,
      price_min: priceMin || undefined,
      price_max: priceMax || undefined,
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
    { key: 'productCode', label: 'Mã SP', sortable: false, render: v => <span className="text-xs text-gray-400 font-mono">{v}</span> },
    { key: 'productName', label: 'Tên sản phẩm', render: v => <span className="font-medium">{v}</span> },
    { key: 'productLine', label: 'Dòng SP', render: v => <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{v}</span> },
    { key: 'quantityInStock', label: 'Tồn kho', render: v => <span className={v < 200 ? 'text-red-600 font-semibold' : ''}>{Number(v).toLocaleString()}</span> },
    { key: 'buyPrice', label: 'Giá nhập', render: v => `$${Number(v).toLocaleString()}` },
    { key: 'MSRP', label: 'MSRP', render: v => `$${Number(v).toLocaleString()}` },
  ]

  return (
    <div>
      <PageHeader title="Sản phẩm" subtitle="Thống kê sản phẩm và tồn kho" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 10 sản phẩm bán chạy (theo doanh thu)</h2>
          {top?.length > 0
            ? <BarChart data={[...top].reverse()} xKey="productName" yKey="revenue" horizontal title="Doanh thu" color="#8b5cf6" />
            : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tồn kho thấp nhất (cần chú ý)</h2>
          {stock?.length > 0
            ? <BarChart data={stock.slice(0, 10)} xKey="productName" yKey="quantityInStock" horizontal title="Tồn kho" color="#ef4444" />
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
                placeholder="Tìm sản phẩm..."
                value={search}
                onChange={reset(setSearch)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Dòng sản phẩm</label>
            <select className="input w-44" value={productLine} onChange={reset(setProductLine)}>
              {PRODUCT_LINES.map(pl => <option key={pl} value={pl}>{pl || 'Tất cả'}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Tồn kho</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" className="input w-20" placeholder="Min"
                value={qtyMin} onChange={reset(setQtyMin)}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number" min="0" className="input w-20" placeholder="Max"
                value={qtyMax} onChange={reset(setQtyMax)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Giá nhập ($)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" className="input w-20" placeholder="Min"
                value={priceMin} onChange={reset(setPriceMin)}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number" min="0" className="input w-20" placeholder="Max"
                value={priceMax} onChange={reset(setPriceMax)}
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
