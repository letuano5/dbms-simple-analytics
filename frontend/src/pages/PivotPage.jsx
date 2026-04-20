import { useQuery } from '@tanstack/react-query'
import { pivotApi } from '../services/api'
import { StackedBarChart, HeatmapChart } from '../components/charts/BaseChart'
import PageHeader from '../components/layout/PageHeader'

const PRODUCT_LINES = ['Classic Cars', 'Motorcycles', 'Planes', 'Ships', 'Trains', 'Trucks and Buses', 'Vintage Cars']
const PL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

function pivotLongToWide(data, rowKey, colKey, valueKey) {
  const rowsSet = new Set()
  const colsSet = new Set()
  data.forEach(d => { rowsSet.add(d[rowKey]); colsSet.add(d[colKey]) })
  const rows = [...rowsSet].sort()
  const cols = [...colsSet].sort()
  const lookup = {}
  data.forEach(d => { lookup[`${d[rowKey]}||${d[colKey]}`] = d[valueKey] })
  const wide = rows.map(r => {
    const obj = { [rowKey]: r }
    cols.forEach(c => { obj[c] = lookup[`${r}||${c}`] || 0 })
    return obj
  })
  return { wide, cols, rows }
}

function transformHeatmap(data, rowKey, colKey, valueKey) {
  const rows = [...new Set(data.map(d => d[rowKey]))].sort()
  const cols = [...new Set(data.map(d => d[colKey]))].sort()
  const lookup = {}
  data.forEach(d => { lookup[`${d[rowKey]}||${d[colKey]}`] = d[valueKey] })
  const heatmapData = []
  rows.forEach((r, ri) => {
    cols.forEach((c, ci) => {
      heatmapData.push([ci, ri, lookup[`${r}||${c}`] || 0])
    })
  })
  return { rows, cols, heatmapData }
}

export default function PivotPage() {
  const { data: plByMonth } = useQuery({
    queryKey: ['pivot-pl-month'],
    queryFn: () => pivotApi.productLineByMonth().then(r => r.data),
  })
  const { data: countryByPL } = useQuery({
    queryKey: ['pivot-country-pl'],
    queryFn: () => pivotApi.countryByProductLine().then(r => r.data),
  })

  const stackedData = plByMonth ? (() => {
    const { wide, cols } = pivotLongToWide(plByMonth, 'period', 'productLine', 'revenue')
    return { wide, seriesKeys: PRODUCT_LINES.filter(pl => cols.includes(pl)) }
  })() : null

  const heatmapData = countryByPL ? transformHeatmap(countryByPL, 'country', 'productLine', 'revenue') : null

  return (
    <div>
      <PageHeader title="Pivot" subtitle="Phân tích chéo dữ liệu đa chiều" />

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Doanh thu theo Dòng sản phẩm × Tháng</h2>
        <p className="text-xs text-gray-400 mb-4">Stacked bar — hover để xem chi tiết từng dòng SP</p>
        {stackedData?.wide?.length > 0
          ? <StackedBarChart data={stackedData.wide} xKey="period" seriesKeys={stackedData.seriesKeys} colors={PL_COLORS} />
          : <div className="h-[320px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Doanh thu theo Quốc gia × Dòng sản phẩm</h2>
        <p className="text-xs text-gray-400 mb-4">Heatmap — màu càng đậm doanh thu càng cao</p>
        {heatmapData?.heatmapData?.length > 0
          ? <HeatmapChart rows={heatmapData.rows} cols={heatmapData.cols} heatmapData={heatmapData.heatmapData} title="Doanh thu" />
          : <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
      </div>
    </div>
  )
}
