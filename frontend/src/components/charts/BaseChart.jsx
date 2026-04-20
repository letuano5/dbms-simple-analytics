import ReactECharts from 'echarts-for-react'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

export function LineChart({ data, xKey, yKey, title, color = '#3b82f6', areaFill = false }) {
  const option = {
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].axisValue}<br/>${p[0].marker} ${Number(p[0].value).toLocaleString('vi-VN')}` },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => d[xKey]), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v } },
    series: [{
      name: title,
      type: 'line',
      data: data.map(d => d[yKey]),
      smooth: true,
      lineStyle: { color, width: 2.5 },
      itemStyle: { color },
      areaStyle: areaFill ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '05' }] } } : undefined,
      symbol: 'circle',
      symbolSize: 5,
    }],
  }
  return <ReactECharts option={option} style={{ height: 280 }} />
}

export function BarChart({ data, xKey, yKey, title, horizontal = false, color = '#3b82f6' }) {
  const option = {
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].axisValue}<br/>${Number(p[0].value).toLocaleString('vi-VN')}` },
    grid: { left: horizontal ? 160 : 60, right: 20, top: 20, bottom: 40 },
    xAxis: horizontal
      ? { type: 'value', axisLabel: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v } }
      : { type: 'category', data: data.map(d => d[xKey]), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: horizontal
      ? { type: 'category', data: data.map(d => d[xKey]), axisLabel: { fontSize: 11 } }
      : { type: 'value', axisLabel: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v } },
    series: [{
      name: title,
      type: 'bar',
      data: data.map(d => d[yKey]),
      itemStyle: {
        color: horizontal ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color }, { offset: 1, color: color + 'aa' }] } : color,
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      barMaxWidth: 40,
    }],
  }
  return <ReactECharts option={option} style={{ height: horizontal ? Math.max(220, data.length * 34) : 280 }} />
}

export function PieChart({ data, nameKey, valueKey, title }) {
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0, type: 'scroll' },
    series: [{
      name: title,
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: data.map((d, i) => ({ name: d[nameKey], value: d[valueKey], itemStyle: { color: COLORS[i % COLORS.length] } })),
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    }],
  }
  return <ReactECharts option={option} style={{ height: 280 }} />
}

export function StackedBarChart({ data, xKey, seriesKeys, colors }) {
  const series = seriesKeys.map((key, i) => ({
    name: key,
    type: 'bar',
    stack: 'total',
    data: data.map(d => +(d[key] || 0).toFixed(2)),
    itemStyle: { color: colors ? colors[i % colors.length] : COLORS[i % COLORS.length] },
    emphasis: { focus: 'series' },
  }))
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params) => {
      const label = params[0].axisValue
      const rows = params.map(p => `${p.marker}${p.seriesName}: ${Number(p.value).toLocaleString('vi-VN')}`).join('<br/>')
      return `${label}<br/>${rows}`
    }},
    legend: { data: seriesKeys, type: 'scroll', bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 60, right: 20, top: 20, bottom: 60 },
    xAxis: { type: 'category', data: data.map(d => d[xKey]), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v } },
    series,
  }
  return <ReactECharts option={option} style={{ height: 320 }} />
}

export function HeatmapChart({ rows, cols, heatmapData, title }) {
  const max = Math.max(...heatmapData.map(d => d[2]))
  const option = {
    tooltip: {
      position: 'top',
      formatter: (p) => `${cols[p.data[0]]} / ${rows[p.data[1]]}<br/>${Number(p.data[2]).toLocaleString('vi-VN')}`,
    },
    grid: { left: 120, right: 40, bottom: 60, top: 10 },
    xAxis: { type: 'category', data: cols, splitArea: { show: true }, axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'category', data: rows, splitArea: { show: true }, axisLabel: { fontSize: 10 } },
    visualMap: { min: 0, max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#eff6ff', '#1d4ed8'] }, textStyle: { fontSize: 10 } },
    series: [{
      name: title,
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
    }],
  }
  return <ReactECharts option={option} style={{ height: Math.max(300, rows.length * 28 + 100) }} />
}
