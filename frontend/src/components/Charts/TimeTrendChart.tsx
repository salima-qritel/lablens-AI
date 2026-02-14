import React from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les problèmes SSR avec Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface TimeTrendChartProps {
  x: string[] | number[];
  y: number[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  mode?: 'lines' | 'markers' | 'lines+markers';
  showLegend?: boolean;
  seriesName?: string;
}

export default function TimeTrendChart({
  x,
  y,
  title = 'Série Temporelle',
  xLabel = 'Date',
  yLabel = 'Valeur',
  color = '#06b6d4',
  mode = 'lines+markers',
  showLegend = false,
  seriesName = 'Série'
}: TimeTrendChartProps) {
  if (!x || !y || x.length === 0 || y.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // S'assurer que x et y ont la même longueur
  const minLength = Math.min(x.length, y.length);
  const xData = x.slice(0, minLength);
  const yData = y.slice(0, minLength);

  if (xData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée valide disponible</p>
      </div>
    );
  }

  const plotData: any = [
    {
      x: xData,
      y: yData,
      type: 'scatter',
      mode: mode,
      name: seriesName,
      line: {
        color: color,
        width: 2
      },
      marker: {
        color: color,
        size: 6
      },
      hovertemplate: '<b>%{x}</b><br>%{y}<extra></extra>',
    }
  ];

  const layout: any = {
    title: {
      text: title,
      font: { size: 16, color: '#1f2937' }
    },
    xaxis: {
      title: xLabel,
      showgrid: true,
      gridcolor: '#e5e7eb',
      type: xData.every(v => typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}/)) ? 'date' : 'linear'
    },
    yaxis: {
      title: yLabel,
      showgrid: true,
      gridcolor: '#e5e7eb'
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 20, t: 50, b: 60 },
    hovermode: 'x unified',
    showlegend: showLegend
  };

  const config: any = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'] as any,
    responsive: true
  };

  return (
    <div className="w-full h-full">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

