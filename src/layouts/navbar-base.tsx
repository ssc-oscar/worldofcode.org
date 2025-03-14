import NavBar from '@/components/navbar';
import { navItems } from '@/config';

export default function NavbarLayout({
  children
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-screen w-screen">
      <NavBar items={navItems} />
      <div className="mt-14 flex w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
