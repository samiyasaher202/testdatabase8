import "./tables.css";

const COLORS = [
  "#1d4ed8",
  "#065f46",
  "#991b1b",
  "#854d0e",
  "#7F77DD",
  "#D85A30",
  "#639922",
  "#475569",
];

const CHART_HEIGHT = 260;
const PADDING = { top: 16, bottom: 48, left: 48, right: 16 };

export default function ColumnChart({
  columns = [],
  data = [],
  xKey = "week",
  title = "Chart",
}) {
  if (!columns.length || !data.length) {
    return (
      <div className="column-chart">
        <p className="column-chart__empty">No data to display.</p>
      </div>
    );
  }


  const totals = columns.map((col, i) => ({
    label: col.label || col.key,
    value: data.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0),
    color: COLORS[i % COLORS.length],
  }));

  const maxValue = Math.max(
    ...data.flatMap((row) => columns.map((col) => Number(row[col.key]) || 0))
  );

  const yTickCount = 5;
  const yTicks = [...new Set(
    Array.from({ length: yTickCount + 1 }, (_, i) =>
      Math.round((maxValue / yTickCount) * i)
    )
  )];

  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const groupWidth = 100 / data.length;
  const barWidth = (groupWidth * 0.7) / columns.length;
  const groupPad = groupWidth * 0.15;

  return (
    <div className="column-chart">
      <header>
        <h2 className="column-chart__title">{title}</h2>
      </header>

      <div className="column-chart__body">
        <div className="column-chart__canvas-wrap">
          <svg
            width="100%"
            height={CHART_HEIGHT}
            style={{ overflow: "visible", display: "block" }}
          >
            {/* Y axis gridlines + labels */}
            {yTicks.map((tick, i) => {
              const y = PADDING.top + plotHeight - (tick / maxValue) * plotHeight;
              return (
                <g key={i}>
                  <line
                    x1={PADDING.left}
                    x2="100%"
                    y1={y}
                    y2={y}
                    stroke="rgba(15,23,42,0.07)"
                    strokeWidth={1}
                  />
                  <text
                    x={PADDING.left - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="#94a3b8"
                    fontFamily="inherit"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Bars + x labels */}
            {data.map((row, gi) => (
              <g key={gi}>
                {columns.map((col, ci) => {
                  const value = Number(row[col.key]) || 0;
                  const barH = maxValue > 0 ? (value / maxValue) * plotHeight : 0;
                  const barX = `${groupPad + gi * groupWidth + ci * barWidth}%`;
                  const barY = PADDING.top + plotHeight - barH;
                  const color = COLORS[ci % COLORS.length];
                  return (
                    <rect
                      key={col.key}
                      x={barX}
                      y={barY}
                      width={`${barWidth * 0.85}%`}
                      height={barH}
                      fill={color}
                      rx={3}
                    />
                  );
                })}

                {/* X axis label */}
                <text
                  x={`${groupPad + gi * groupWidth + (groupWidth * 0.7) / 2}%`}
                  y={PADDING.top + plotHeight + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94a3b8"
                  fontFamily="inherit"
                >
                  {String(row[xKey])}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend — stacked vertically on the right */}
        <div className="column-chart__legend">
          {columns.map((col, i) => (
            <div key={col.key} className="column-chart__legend-item">
              <span
                className="column-chart__legend-swatch"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span>{col.label || col.key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}