import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { pivotApi } from '../services/api'
import { StackedBarChart, HeatmapChart } from '../components/charts/BaseChart'
import PageHeader from '../components/layout/PageHeader'

const PRODUCT_LINES = ['Classic Cars', 'Motorcycles', 'Planes', 'Ships', 'Trains', 'Trucks and Buses', 'Vintage Cars']
const PL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

const DIM_OPTIONS = [
  { value: 'country', label: 'Quốc gia' },
  { value: 'productLine', label: 'Dòng sản phẩm' },
  { value: 'year', label: 'Năm' },
  { value: 'month', label: 'Tháng' },
  { value: 'status', label: 'Trạng thái đơn' },
]

const METRIC_OPTIONS = [
  { value: 'revenue', label: 'Doanh thu ($)' },
  { value: 'quantity', label: 'Số lượng bán' },
  { value: 'orders', label: 'Số đơn hàng' },
]

function fmtValue(val, metric) {
  if (!val) return '—'
  if (metric === 'revenue') return '$' + Number(val).toLocaleString()
  return Number(val).toLocaleString()
}

function PivotTable({ data, rowDim, colDim, metric, loading }) {
  if (loading) {
    return <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
  }
  if (!data?.length) {
    return <div className="py-16 text-center text-gray-400 text-sm">Không có dữ liệu</div>
  }

  const rowVals = [...new Set(data.map(d => d.row_val))].sort()
  const colVals = [...new Set(data.map(d => d.col_val))].sort()
  const lookup = {}
  data.forEach(d => { lookup[`${d.row_val}||${d.col_val}`] = Number(d.value) })

  const rowTotals = {}
  rowVals.forEach(r => {
    rowTotals[r] = colVals.reduce((s, c) => s + (lookup[`${r}||${c}`] || 0), 0)
  })
  const colTotals = {}
  colVals.forEach(c => {
    colTotals[c] = rowVals.reduce((s, r) => s + (lookup[`${r}||${c}`] || 0), 0)
  })
  const grandTotal = Object.values(rowTotals).reduce((a, b) => a + b, 0)

  const colMaxes = {}
  colVals.forEach(c => { colMaxes[c] = Math.max(...rowVals.map(r => lookup[`${r}||${c}`] || 0)) })

  const rowLabel = DIM_OPTIONS.find(d => d.value === rowDim)?.label
  const colLabel = DIM_OPTIONS.find(d => d.value === colDim)?.label

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-100 px-3 py-2.5 text-left font-semibold text-gray-600 border border-gray-200 whitespace-nowrap min-w-[140px]">
              {rowLabel} ╲ {colLabel}
            </th>
            {colVals.map(c => (
              <th key={c} className="px-3 py-2.5 text-right font-semibold text-gray-600 border border-gray-200 whitespace-nowrap bg-gray-50 min-w-[100px]">
                {c}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right font-bold text-blue-700 border border-gray-200 whitespace-nowrap bg-blue-50 min-w-[110px]">
              Tổng hàng
            </th>
          </tr>
        </thead>
        <tbody>
          {rowVals.map((r, ri) => (
            <tr key={r} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
              <td className="sticky left-0 z-10 px-3 py-2 font-medium text-gray-700 border border-gray-200 whitespace-nowrap bg-inherit">
                {r}
              </td>
              {colVals.map(c => {
                const val = lookup[`${r}||${c}`] || 0
                const pct = colMaxes[c] > 0 ? val / colMaxes[c] : 0
                const bg = val > 0 ? `rgba(59,130,246,${(0.06 + pct * 0.22).toFixed(2)})` : 'transparent'
                return (
                  <td
                    key={c}
                    className="px-3 py-2 text-right border border-gray-200 whitespace-nowrap tabular-nums text-gray-700"
                    style={{ backgroundColor: bg }}
                  >
                    {fmtValue(val, metric)}
                  </td>
                )
              })}
              <td className="px-3 py-2 text-right font-semibold text-blue-700 border border-gray-200 whitespace-nowrap tabular-nums bg-blue-50/40">
                {fmtValue(rowTotals[r], metric)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50">
            <td className="sticky left-0 z-10 px-3 py-2.5 font-bold text-blue-700 border border-gray-200 whitespace-nowrap bg-blue-50">
              Tổng cột
            </td>
            {colVals.map(c => (
              <td key={c} className="px-3 py-2.5 text-right font-semibold text-blue-700 border border-gray-200 whitespace-nowrap tabular-nums">
                {fmtValue(colTotals[c], metric)}
              </td>
            ))}
            <td className="px-3 py-2.5 text-right font-bold text-blue-800 border-2 border-blue-300 whitespace-nowrap tabular-nums bg-blue-100">
              {fmtValue(grandTotal, metric)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

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
  const [rowDim, setRowDim] = useState('country')
  const [colDim, setColDim] = useState('productLine')
  const [metric, setMetric] = useState('revenue')

  const invalid = rowDim === colDim

  const { data: customData, isLoading } = useQuery({
    queryKey: ['pivot-custom', rowDim, colDim, metric],
    queryFn: () => pivotApi.custom({ row_dim: rowDim, col_dim: colDim, value_metric: metric }).then(r => r.data),
    placeholderData: keepPreviousData,
    enabled: !invalid,
  })

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

  const availableCols = DIM_OPTIONS.filter(d => d.value !== rowDim)
  const availableRows = DIM_OPTIONS.filter(d => d.value !== colDim)

  return (
    <div>
      <PageHeader title="Pivot" subtitle="Phân tích chéo dữ liệu đa chiều" />

      {/* Interactive pivot */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Hàng (Row)</label>
            <select className="input w-44" value={rowDim} onChange={e => setRowDim(e.target.value)}>
              {availableRows.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Cột (Column)</label>
            <select className="input w-44" value={colDim} onChange={e => setColDim(e.target.value)}>
              {availableCols.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Giá trị</label>
            <select className="input w-44" value={metric} onChange={e => setMetric(e.target.value)}>
              {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="text-xs text-gray-400 pb-2">
            Màu ô đậm hơn = giá trị cao hơn trong cùng cột
          </div>
        </div>

        <PivotTable
          data={customData}
          rowDim={rowDim}
          colDim={colDim}
          metric={metric}
          loading={isLoading && !customData}
        />
      </div>

      {/* Static charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Doanh thu theo Dòng sản phẩm × Tháng</h2>
          <p className="text-xs text-gray-400 mb-4">Stacked bar — hover để xem chi tiết từng dòng SP</p>
          {stackedData?.wide?.length > 0
            ? <StackedBarChart data={stackedData.wide} xKey="period" seriesKeys={stackedData.seriesKeys} colors={PL_COLORS} />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Doanh thu theo Quốc gia × Dòng sản phẩm</h2>
          <p className="text-xs text-gray-400 mb-4">Heatmap — màu càng đậm doanh thu càng cao</p>
          {heatmapData?.heatmapData?.length > 0
            ? <HeatmapChart rows={heatmapData.rows} cols={heatmapData.cols} heatmapData={heatmapData.heatmapData} title="Doanh thu" />
            : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}
        </div>
      </div>
    </div>
  )
}
