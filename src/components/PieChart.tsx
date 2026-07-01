import React, { useState } from 'react';
import { formatCurrency } from './SettingsView';

interface PieSegment {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSegment[];
  currency: string;
  theme?: string;
  title?: string;
  centerLabel?: string;
  centerValue?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  currency,
  theme = 'luxo',
  title,
  centerLabel = 'Total',
  centerValue,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const displayTotal = centerValue !== undefined ? centerValue : total;

  // Center coordinates and radius
  const cx = 100;
  const cy = 100;
  const rOuter = 80;
  const rInner = 58;

  let accumulatedAngle = 0;

  const slices = data.map((item, idx) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = total > 0 ? (item.value / total) * 360 : 0;

    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    // Determine slice coordinates
    const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
    const endAngleRad = ((endAngle - 90) * Math.PI) / 180;

    const isHovered = hoveredIdx === idx;
    const currentROuter = isHovered ? rOuter + 4 : rOuter;
    const currentRInner = isHovered ? rInner - 1 : rInner;

    const x1_outer = cx + currentROuter * Math.cos(startAngleRad);
    const y1_outer = cy + currentROuter * Math.sin(startAngleRad);
    const x2_outer = cx + currentROuter * Math.cos(endAngleRad);
    const y2_outer = cy + currentROuter * Math.sin(endAngleRad);

    const x1_inner = cx + currentRInner * Math.cos(startAngleRad);
    const y1_inner = cy + currentRInner * Math.sin(startAngleRad);
    const x2_inner = cx + currentRInner * Math.cos(endAngleRad);
    const y2_inner = cy + currentRInner * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // Quando a fatia representa (quase) 100% dos dados, o hack de path
    // "M...A...Z" com pontos quase coincidentes é instável entre navegadores
    // e pode gerar artefatos visuais (o "círculo duplo/fantasma").
    // Nesse caso, desenhamos um <circle> com stroke em vez de um <path>,
    // que é geometricamente exato para um anel completo.
    const isFullCircle = angle >= 359.99;

    let pathData = '';
    if (!isFullCircle) {
      pathData = `
        M ${x1_outer} ${y1_outer}
        A ${currentROuter} ${currentROuter} 0 ${largeArcFlag} 1 ${x2_outer} ${y2_outer}
        L ${x2_inner} ${y2_inner}
        A ${currentRInner} ${currentRInner} 0 ${largeArcFlag} 0 ${x1_inner} ${y1_inner}
        Z
      `;
    }

    return {
      ...item,
      percentage,
      pathData,
      isHovered,
      isFullCircle,
      currentROuter,
      currentRInner,
    };
  });

  const textPrimary = theme === 'claro' ? 'text-stone-900' : 'text-white';
  const textSecondary = theme === 'claro' ? 'text-stone-500' : 'text-neutral-400';
  const legendBg = theme === 'luxo' 
    ? 'bg-neutral-950/40 border border-neutral-800/40' 
    : theme === 'claro' 
    ? 'bg-stone-50 border border-stone-200' 
    : 'bg-stone-950/40 border border-stone-800/40';

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-4 select-none">
      {/* Chart Canvas */}
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={rOuter}
              fill="none"
              stroke={theme === 'claro' ? '#e7e5e4' : '#262626'}
              strokeWidth={rOuter - rInner}
            />
          ) : (
            slices.map((slice, idx) =>
              slice.isFullCircle ? (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={(slice.currentROuter + slice.currentRInner) / 2}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={slice.currentROuter - slice.currentRInner}
                  className="transition-all duration-300 cursor-pointer hover:brightness-110"
                  style={{
                    filter: slice.isHovered ? 'drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.45))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  id={`pie-slice-${idx}`}
                />
              ) : (
                <path
                  key={idx}
                  d={slice.pathData}
                  fill={slice.color}
                  className="transition-all duration-300 cursor-pointer hover:brightness-110"
                  style={{
                    filter: slice.isHovered ? 'drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.45))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  id={`pie-slice-${idx}`}
                />
              )
            )
          )}
        </svg>

        {/* Center Content for Donut hole */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2"
          style={{ width: '100%', height: '100%' }}
        >
          {hoveredIdx !== null ? (
            <>
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-medium truncate max-w-[100px]">
                {slices[hoveredIdx].name}
              </span>
              <span className={`text-xs font-bold font-mono mt-0.5 ${textPrimary}`}>
                {slices[hoveredIdx].percentage.toFixed(1)}%
              </span>
              <span className={`font-mono mt-0.5 text-neutral-500 font-semibold ${
                formatCurrency(slices[hoveredIdx].value, currency).length > 12 ? 'text-[9px]' : 'text-[10px]'
              }`}>
                {formatCurrency(slices[hoveredIdx].value, currency)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-medium truncate max-w-[100px]">
                {centerLabel}
              </span>
              <span className={`font-bold font-mono mt-0.5 tracking-tight ${textPrimary} ${
                (() => {
                  const valStr = formatCurrency(displayTotal, currency);
                  if (valStr.length > 14) return 'text-[9px]';
                  if (valStr.length > 11) return 'text-[11px]';
                  if (valStr.length > 8) return 'text-xs';
                  return 'text-sm';
                })()
              }`}>
                {formatCurrency(displayTotal, currency)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend Grid */}
      <div className="flex-1 w-full flex flex-col gap-2 max-w-sm">
        {total === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-500 italic">
            Sem lançamentos no período
          </div>
        ) : (
          slices.map((slice, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer ${legendBg} ${
                hoveredIdx === idx ? 'ring-1 ring-neutral-700 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              id={`pie-legend-item-${idx}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className={`font-medium truncate max-w-[150px] ${textPrimary}`}>
                  {slice.name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-right flex-shrink-0">
                <span className={textSecondary}>{formatCurrency(slice.value, currency)}</span>
                <span className="text-[10px] font-bold text-neutral-500 w-11">
                  ({slice.percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};