'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export function TokenDistributionChart() {
  const data = {
    labels: ['Public Sale', 'Platform Development', 'Team & Advisors', 'Marketing', 'Community Rewards'],
    datasets: [
      {
        data: [40, 25, 15, 10, 10],
        backgroundColor: [
          '#ff4d8d',
          '#9d4edd',
          '#5a189a',
          '#3c096c',
          '#240046',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          padding: 20,
          boxWidth: 15,
          font: {
            size: 12
          }
        },
      },
    },
  };

  return (
    <div className="w-full h-[300px]">
      <Pie data={data} options={options} />
    </div>
  );
} 