import NavbarLayout from '@/layouts/navbar-layout';
import { Outlet } from 'react-router-dom';

export default function About() {
  return (
    <NavbarLayout>
      <Outlet />
    </NavbarLayout>
  );
}
