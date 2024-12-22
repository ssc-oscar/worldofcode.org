import { useState } from 'react';
import Sidebar from '../shared/sidebar';
import Header from '../shared/header';
import MobileSidebar from '../shared/mobile-sidebar';
import { MenuIcon } from 'lucide-react';
import NavBar from '../shared/navbar';
import { navItems } from '@/constants/routes';

export default function NavbarLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-secondary">
      <NavBar items={navItems} />
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <main className="relative flex-1 overflow-hidden bg-background focus:outline-none md:mx-0 md:my-4 md:mr-4">
          {children}
        </main>
      </div>
    </div>
  );
}
