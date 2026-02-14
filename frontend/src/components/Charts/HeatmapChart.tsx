import React from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les problèmes SSR avec Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface HeatmapChartProps {
  data: { [key: string]: { [key: string]: number } } | number[][];
  xLabels?: string[];
  yLabels?: string[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  colorscale?: string;
}

export default function HeatmapChart({
  data,
  xLabels,
  yLabels,
  title = 'Matrice de Co-occurrence',
  xLabel = 'Test 1',
  yLabel = 'Test 2',
  colorscale = 'Blues'
}: HeatmapChartProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  let z: number[][] = [];
  let x: string[] = [];
  let y: string[] = [];

  // Si data est un objet (format {test1: {test2: count}})
  if (typeof data === 'object' && !Array.isArray(data) && !Array.isArray(Object.values(data)[0])) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucune donnée disponible</p>
        </div>
      );
    }

    // Utiliser les labels fournis ou les clés
    x = xLabels || keys;
    y = yLabels || keys;

    // Construire la matrice
    z = y.map(yKey => 
      x.map(xKey => {
        const row = data[yKey as keyof typeof data];
        if (row && typeof row === 'object') {
          return (row as any)[xKey] || 0;
        }
        return 0;
      })
    );
  } 
  // Si data est déjà une matrice 2D
  else if (Array.isArray(data) && Array.isArray(data[0])) {
    z = data as number[][];
    x = xLabels || z[0]?.map((_, i) => `Col ${i + 1}`) || [];
    y = yLabels || z.map((_, i) => `Row ${i + 1}`) || [];
  } else {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Format de données non supporté</p>
      </div>
    );
  }

  if (z.length === 0 || z[0].length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  const plotData: any = [
    {
      z: z,
      x: x,
      y: y,
      type: 'heatmap',
      colorscale: colorscale,
      showscale: true,
      hovertemplate: '<b>%{y}</b> × <b>%{x}</b><br>Co-occurrence: %{z}<extra></extra>',
      colorbar: {
        title: 'Fréquence',
        titleside: 'right'
      }
    }
  ];

  const layout: any = {
    title: {
      text: title,
      font: { size: 16, color: '#1f2937' }
    },
    xaxis: {
      title: xLabel,
      showgrid: false,
      side: 'bottom'
    },
    yaxis: {
      title: yLabel,
      showgrid: false,
      autorange: 'reversed' // Pour avoir la première ligne en haut
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    margin: { l: 120, r: 20, t: 50, b: 120 },
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

