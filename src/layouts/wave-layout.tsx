import WaveBackground from '@/components/bg-animation';
import NavbarLayout from './navbar-layout';

export default function WaveLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <NavbarLayout>
      {children}
      <WaveBackground />
    </NavbarLayout>
  );
}
