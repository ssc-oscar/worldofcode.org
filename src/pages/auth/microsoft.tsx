import { useRouter } from '@/hooks/use-router';

export default function MicrosoftLogin() {
  const url = '/';
  const router = useRouter();
  setTimeout(() => {
    router.push(url);
  }, 100);
  return (
    <div>
      <h1>
        Redirecting to{' '}
        <a href={url} className="text-blue underline">
          Microsoft
        </a>{' '}
        ...
      </h1>
    </div>
  );
}
