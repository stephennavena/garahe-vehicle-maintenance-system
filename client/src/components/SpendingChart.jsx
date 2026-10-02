import { useMemo, useState } from 'react';

export default function SpendingChart({ entries = [] }) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

  const { chartData, totalSpend, avgMonthly, maxMonth } = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { chartData: [], totalSpend: 0, avgMonthly: 0, maxMonth: null };
    }

    const map = {};
    let total = 0;

    for (const e of entries) {
      if (!e.date) continue;
      const month = String(e.date).slice(0, 7); // "YYYY-MM"
      const cost = Number(e.cost) || 0;
      if (!map[month]) map[month] = { total: 0, count: 0 };
      map[month].total += cost;
      map[month].count += 1;
      total += cost;
    }

    // Determine timeline: minimum 6 continuous months ending at current month
    const now = new Date();
    const allMonths = Object.keys(map).sort();
    const earliestMonth = allMonths[0] || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Min 6, max 12 months back
    const [eYear, eMonth] = earliestMonth.split('-').map(Number);
    const monthsDiff = (now.getFullYear() - eYear) * 12 + (now.getMonth() + 1 - eMonth);
    const countBack = Math.max(5, Math.min(11, isNaN(monthsDiff) ? 5 : monthsDiff));

    const timeline = [];
    for (let i = countBack; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = map[key] || { total: 0, count: 0 };
      timeline.push({
        month: key,
        label: d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
        fullLabel: d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
        total: entry.total,
        count: entry.count,
      });
    }

    // Active months average
    const activeMonths = timeline.filter(m => m.total > 0);
    const avg = activeMonths.length > 0 ? Math.round(total / activeMonths.length) : 0;
    
    // Peak month
    let peak = null;
    for (const m of timeline) {
      if (!peak || m.total > peak.total) peak = m;
    }

    return {
      chartData: timeline,
      totalSpend: total,
      avgMonthly: avg,
      maxMonth: peak && peak.total > 0 ? peak : null,
    };
  }, [entries]);

  if (chartData.length === 0) return null;

  // SVG layout constants (ViewBox coordinate space)
  const V_WIDTH = 760;
  const V_HEIGHT = 220;
  const PAD_LEFT = 75;
  const PAD_RIGHT = 30;
  const PAD_TOP = 25;
  const PAD_BOTTOM = 38;

  const usableW = V_WIDTH - PAD_LEFT - PAD_RIGHT;
  const usableH = V_HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Maximum value for scaling (round up to clean number)
  const rawMax = Math.max(...chartData.map(d => d.total), 1);
  let maxVal = Math.ceil(rawMax / 1000) * 1000;
  if (maxVal < 5000) maxVal = 5000;

  // 4 horizontal gridlines
  const ticks = [0, 0.33, 0.66, 1].map(t => Math.round(maxVal * t));

  const slotW = usableW / chartData.length;
  const barW = Math.min(46, Math.max(22, slotW * 0.55));

  return (
    <div className="card spending-chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Period Spend</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>₱{totalSpend.toLocaleString()}</div>
          </div>
          {avgMonthly > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Monthly Avg</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-color)' }}>₱{avgMonthly.toLocaleString()}</div>
            </div>
          )}
          {maxMonth && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Month</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                {maxMonth.label} (₱{maxMonth.total.toLocaleString()})
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px', border: '1px solid var(--card-border)' }}>
          <button
            type="button"
            className="btn btn-xs"
            style={{
              background: viewMode === 'chart' ? 'var(--accent-color)' : 'transparent',
              color: viewMode === 'chart' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: viewMode === 'chart' ? 600 : 400,
            }}
            onClick={() => setViewMode('chart')}
          >
            📊 Bar Chart
          </button>
          <button
            type="button"
            className="btn btn-xs"
            style={{
              background: viewMode === 'table' ? 'var(--accent-color)' : 'transparent',
              color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: viewMode === 'table' ? 600 : 400,
            }}
            onClick={() => setViewMode('table')}
          >
            📋 Breakdown Table
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <svg
            viewBox={`0 0 ${V_WIDTH} ${V_HEIGHT}`}
            style={{ width: '100%', minWidth: '450px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="spendingBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {ticks.map((tick, i) => {
              const y = PAD_TOP + usableH - (tick / maxVal) * usableH;
              return (
                <g key={i}>
                  <line
                    x1={PAD_LEFT}
                    y1={y}
                    x2={V_WIDTH - PAD_RIGHT}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray={tick === 0 ? 'none' : '4 4'}
                    strokeWidth={tick === 0 ? 1.5 : 1}
                  />
                  <text
                    x={PAD_LEFT - 10}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="inherit"
                    textAnchor="end"
                  >
                    {tick >= 1000 ? `₱${(tick / 1000).toLocaleString()}k` : `₱${tick}`}
                  </text>
                </g>
              );
            })}

            {chartData.map((d, i) => {
              const centerX = PAD_LEFT + i * slotW + slotW / 2;
              const barX = centerX - barW / 2;
              const barH = (d.total / maxVal) * usableH;
              const barY = PAD_TOP + usableH - barH;

              return (
                <g key={d.month} className="chart-bar-group">
                  <rect
                    x={PAD_LEFT + i * slotW + 2}
                    y={PAD_TOP}
                    width={slotW - 4}
                    height={usableH}
                    fill="transparent"
                  >
                    <title>{`${d.fullLabel}: ₱${d.total.toLocaleString()} (${d.count} job${d.count !== 1 ? 's' : ''})`}</title>
                  </rect>

                  {d.total > 0 ? (
                    <>
                      <rect
                        x={barX}
                        y={barY}
                        width={barW}
                        height={Math.max(barH, 4)}
                        rx={5}
                        fill="url(#spendingBarGrad)"
                      >
                        <title>{`${d.fullLabel}: ₱${d.total.toLocaleString()} (${d.count} job${d.count !== 1 ? 's' : ''})`}</title>
                      </rect>
                      <text
                        x={centerX}
                        y={Math.max(barY - 7, PAD_TOP - 6)}
                        fill="#f8fafc"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="inherit"
                        textAnchor="middle"
                      >
                        {d.total >= 10000 ? `₱${(d.total / 1000).toFixed(1)}k` : `₱${d.total.toLocaleString()}`}
                      </text>
                    </>
                  ) : (
                    <line
                      x1={centerX - 8}
                      y1={PAD_TOP + usableH}
                      x2={centerX + 8}
                      y2={PAD_TOP + usableH}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="2"
                    >
                      <title>{`${d.fullLabel}: ₱0 spent`}</title>
                    </line>
                  )}

                  <text
                    x={centerX}
                    y={V_HEIGHT - 12}
                    fill={d.total > 0 ? '#e2e8f0' : '#64748b'}
                    fontSize="11"
                    fontWeight={d.total > 0 ? '600' : '400'}
                    fontFamily="inherit"
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Month</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Jobs Logged</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Total Spent</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map(d => {
                const share = totalSpend > 0 ? Math.round((d.total / totalSpend) * 100) : 0;
                return (
                  <tr key={d.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: d.total > 0 ? '#f8fafc' : '#64748b' }}>
                      {d.fullLabel}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {d.count}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 600, color: d.total > 0 ? 'var(--accent-color)' : '#64748b' }}>
                      ₱{d.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                      {share}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
