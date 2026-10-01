import { useMemo } from 'react';

/**
 * SpendingChart — renders a monthly bar chart of maintenance + fuel spending.
 * Uses plain SVG, no external chart library needed.
 */
export default function SpendingChart({ entries = [], fuelLogs = [] }) {
  const chartData = useMemo(() => {
    // Aggregate by YYYY-MM
    const map = {};

    for (const e of entries) {
      if (!e.date) continue;
      const month = e.date.slice(0, 7); // "2026-09"
      if (!map[month]) map[month] = { maintenance: 0, fuel: 0 };
      map[month].maintenance += Number(e.cost) || 0;
    }

    for (const l of fuelLogs) {
      if (!l.date) continue;
      const month = l.date.slice(0, 7);
      if (!map[month]) map[month] = { maintenance: 0, fuel: 0 };
      map[month].fuel += Number(l.totalCost) || 0;
    }

    // Sort by month, take last 12
    const sorted = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);

    return sorted.map(([month, vals]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
      maintenance: vals.maintenance,
      fuel: vals.fuel,
      total: vals.maintenance + vals.fuel,
    }));
  }, [entries, fuelLogs]);

  if (chartData.length === 0) return null;

  const maxVal = Math.max(...chartData.map(d => d.total), 1);
  const chartH = 200;
  const barW = 40;
  const gap = 16;
  const labelH = 36;
  const paddingLeft = 64;
  const chartWidth = chartData.length * (barW + gap) + paddingLeft + 16;

  // Y-axis tick values
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxVal * t));

  return (
    <div className="card spending-chart-card">
      <div className="chart-legend" style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
        <span><span className="legend-dot" style={{ background: 'var(--accent-color)' }} /> Maintenance</span>
        <span><span className="legend-dot" style={{ background: 'var(--success-color)' }} /> Fuel</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg
          width={chartWidth}
          height={chartH + labelH + 8}
          style={{ display: 'block', minWidth: '100%' }}
        >
          {/* Y-axis gridlines + labels */}
          {ticks.map((tick, i) => {
            const y = chartH - (tick / maxVal) * chartH;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - 8}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="11"
                  textAnchor="end"
                >
                  {tick >= 1000 ? `₱${(tick / 1000).toFixed(0)}k` : `₱${tick}`}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((d, i) => {
            const x = paddingLeft + i * (barW + gap);
            const mainH = (d.maintenance / maxVal) * chartH;
            const fuelH = (d.fuel / maxVal) * chartH;
            const stackedH = mainH + fuelH;

            return (
              <g key={d.month}>
                {/* Fuel bar (bottom) */}
                {fuelH > 0 && (
                  <rect
                    x={x}
                    y={chartH - fuelH}
                    width={barW}
                    height={fuelH}
                    rx={fuelH > 0 && mainH === 0 ? 4 : 0}
                    fill="var(--success-color)"
                    opacity={0.75}
                  >
                    <title>Fuel: ₱{d.fuel.toLocaleString()}</title>
                  </rect>
                )}
                {/* Maintenance bar (on top) */}
                {mainH > 0 && (
                  <rect
                    x={x}
                    y={chartH - stackedH}
                    width={barW}
                    height={mainH}
                    rx={4}
                    fill="var(--accent-color)"
                    opacity={0.85}
                  >
                    <title>Maintenance: ₱{d.maintenance.toLocaleString()}</title>
                  </rect>
                )}
                {/* Month label */}
                <text
                  x={x + barW / 2}
                  y={chartH + labelH - 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {d.label}
                </text>
                {/* Total label on top of bar */}
                {d.total > 0 && (
                  <text
                    x={x + barW / 2}
                    y={chartH - stackedH - 5}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {d.total >= 1000 ? `₱${(d.total / 1000).toFixed(1)}k` : `₱${d.total}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
