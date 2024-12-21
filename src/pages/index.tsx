import DashboardLayout from '@/components/layout/dashboard-layout';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

export default function HomePage() {
  return (
    <DashboardLayout>
      <Suspense>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}
