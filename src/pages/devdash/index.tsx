import WaveLayout from '@/layouts/wave-layout';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Pie, type PieConfig } from '@ant-design/charts';

function DemoPie(props: Partial<PieConfig>) {
  let defaultConfig = {
    data: {
      type: 'fetch',
      value:
        'https://render.alipay.com/p/yuyan/180020010001215413/antd-charts/pie-doughnut.json'
    },
    angleField: 'value',
    colorField: 'name',
    legend: false,
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
  return (
    <Pie
      {...{ ...defaultConfig, ...props }}
      onRender={() => {
        const container = document.getElementById('container');
        if (container) createRoot(container).render(this);
      }}
    />
  );
}

export default function DashboardPage() {
  return (
    <WaveLayout>
      <div id="container">
        <DemoPie data={{}} />
      </div>
    </WaveLayout>
  );
}
