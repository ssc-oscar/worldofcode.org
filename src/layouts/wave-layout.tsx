import NavBarBase from '@/layouts/navbar-base';
import WaveBackground from '@/components/bg-animation';
import { cn } from '@/lib/utils';
import '@/styles/homepage.css';

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
          'relative flex max-w-7xl flex-1 flex-col items-center pb-5 md:pb-20',
          'bg-background px-auto main-container justify-center focus:outline-none',
          className
        )}
      >
        {children}
      </main>
      <WaveBackground />
    </NavBarBase>
  );
}
