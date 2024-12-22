import { useState } from 'react';
import MobileSidebar from '@/components/mobile-sidebar';
import { MenuIcon } from 'lucide-react';
import NavBar from '@/components/navbar';
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
        <main className="relative flex-1 overflow-hidden bg-background focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
