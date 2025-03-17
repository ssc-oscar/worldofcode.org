import WaveLayout from '@/layouts/wave-layout';

export default function DashboardPage() {
  return (
    <WaveLayout>
      <div className="flex items-center justify-center gap-4">
        <div className="i-fluent-emoji-flat:construction size-8" />
        <div>
          <p>This page is under construction.</p>
          <p>Please check back soon.</p>
        </div>
      </div>
    </WaveLayout>
  );
}
