import "./tables.css";
import "./pie_chart.css";

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

/**
 *   <PieChart
 *     title="Ticket Breakdown"
 *     slices={[
 *       { key: "Resolved_Sum",   label: "Resolved" },
 *       { key: "Pending_Sum",    label: "Pending" },
 *       { key: "Unresolved_Sum", label: "Unresolved" },
 *     ]}
 *     data={weeklyData}
 *     data={[{ resolved: 42, pending: 10, unresolved: 8 }]}
 *   />
 */
export default function PieChart({ slices = [], data = [], title = "Chart" }) {
  if (!slices.length || !data.length) {
    return (
      <div className="pie-chart">
        <p className="column-chart__empty">No data to display.</p>
      </div>
    );
  }
  const totals = slices.map((slice, i) => ({
    label: slice.label || slice.key,
    value: data.reduce((sum, row) => sum + (Number(row[slice.key]) || 0), 0),
    color: COLORS[i % COLORS.length],
  }));

  const grand = totals.reduce((s, t) => s + t.value, 0);

  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = SIZE / 2 - 8;

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function slicePath(startAngle, endAngle) {
    const start = polarToCartesian(CX, CY, R, startAngle);
    const end = polarToCartesian(CX, CY, R, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${CX} ${CY}`,
      `L ${start.x} ${start.y}`,
      `A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  }

  let currentAngle = 0;
  const paths = totals.map((t) => {
    const sweep = grand > 0 ? (t.value / grand) * 360 : 0;
    const start = currentAngle;
    const end = currentAngle + sweep;
    currentAngle = end;
    return { ...t, path: slicePath(start, end), sweep };
  });

  return (
    <div className="pie-chart">
      <header>
        <h2 className="column-chart__title">{title}</h2>
      </header>

      {/* Pie + legend */}
      <div className="column-chart__body">
        <div className="pie-chart__canvas-wrap">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            style={{ display: "block" }}
          >
            {paths.map((p) =>
              p.sweep > 0 ? (
                <path
                  key={p.label}
                  d={p.path}
                  fill={p.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ) : null
            )}
          </svg>
        </div>

        {/* Legend — stacked vertically on the right */}
        <div className="column-chart__legend">
          {totals.map(({ label, value, color }) => (
            <div key={label} className="column-chart__legend-item">
              <span
                className="column-chart__legend-swatch"
                style={{ background: color }}
              />
              <span>
                {label}
                <span className="pie-chart__legend-pct">
                  {grand > 0 ? ` ${Math.round((value / grand) * 100)}%` : ""}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}