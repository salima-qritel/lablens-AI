import React from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les problèmes SSR avec Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DistributionChartProps {
  data: number[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  bins?: number;
  color?: string;
}

export default function DistributionChart({
  data,
  title = 'Distribution',
  xLabel = 'Valeur',
  yLabel = 'Fréquence',
  bins = 30,
  color = '#06b6d4'
}: DistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // Filtrer les valeurs valides (non null, non undefined, non NaN)
  const validData = data.filter(v => v != null && !isNaN(v) && isFinite(v));

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée valide disponible</p>
      </div>
    );
  }

  const plotData: any = [
    {
      x: validData,
      type: 'histogram',
      nbinsx: bins,
      marker: {
        color: color,
        line: {
          color: '#0891b2',
          width: 1
        }
      },
      hovertemplate: '<b>%{x}</b><br>Fréquence: %{y}<extra></extra>',
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
      gridcolor: '#e5e7eb'
    },
    yaxis: {
      title: yLabel,
      showgrid: true,
      gridcolor: '#e5e7eb'
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 20, t: 50, b: 60 },
    hovermode: 'closest'
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

