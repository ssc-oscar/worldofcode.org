import WaveLayout from '@/layouts/wave-layout';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Pie, type PieConfig } from '@ant-design/charts';

function DemoPie(props: Partial<PieConfig> = {}) {
  let fileInfoData = {
    Perl: 31,
    Rust: 67,
    Java: 1,
    other: 13784,
    'C/C++': 1278,
    Ruby: 123,
    JavaScript: 1343,
    Python: 189,
    Go: 30587
  };
  let values = Object.entries(fileInfoData).map(([name, value]) => ({
    name,
    value
  }));
  values.sort((a, b) => b.value - a.value);
  let defaultConfig = {
    data: {
      value: values
    },
    angleField: 'value',
    colorField: 'name',
    legend: true,
    innerRadius: 0.6,
    labels: [
      { text: 'name', style: { fontSize: 10, fontWeight: 'bold' } },
      {
        text: (d, i, data) => (i < data.length - 3 ? d.value : ''),
        style: {
          fontSize: 9,
          dy: 12
        }
      }
    ],
    style: {
      stroke: '#fff',
      inset: 1,
      radius: 10
    },
    scale: {
      color: {
        palette: 'spectral',
        offset: (t) => t * 0.8 + 0.1
      }
    }
  };
  return <Pie {...defaultConfig} {...props} />;
}

export default function DashboardPage() {
  return (
    <WaveLayout>
      <div id="container">
        <DemoPie />
      </div>
    </WaveLayout>
  );
}
