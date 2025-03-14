import WaveLayout from '@/layouts/wave-layout';
import { useLocation } from 'react-router-dom';

export default function DashboardPage() {
  // what is my slug?
  const authorId = decodeURIComponent(useLocation().pathname.split('/')[2]);

  return (
    <WaveLayout>
      <div>{authorId}</div>
    </WaveLayout>
  );
}
