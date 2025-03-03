import NavBarBase from '@/layouts/navbar-base';
import { cn } from '@/lib/utils';

export default function NavbarLayout({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <NavBarBase>
      <main
        className={cn(
          'bg-background px-auto relative flex max-w-7xl flex-1 flex-col',
          'mx-auto items-center justify-center focus:outline-none',
          className
        )}
      >
        {children}
      </main>
    </NavBarBase>
  );
}
