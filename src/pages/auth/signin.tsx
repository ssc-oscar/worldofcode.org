import Logo from '@/components/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/hooks/use-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BASE_URL, TURNSTILE_SITE_ID } from '@/config';
import * as z from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' })
});

type UserFormValue = z.infer<typeof formSchema>;

export function UserAuthForm() {
  const router = useRouter();
  const [loading] = useState(false);
  const defaultValues = {
    email: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  const [token, setToken] = useState('');

  const onSubmit = async (data: UserFormValue) => {
    console.log('data', data);
    router.push('/');
  };

  const { toast } = useToast();

  const redirectHandler = (provider: string) => {
    if (loading) return;
    if (!token)
      return toast({
        title: 'Error',
        description: 'Please complete the captcha'
      });
    router.push(
      `${BASE_URL}/auth/${provider}/login?cf_turnstile_response=${token}`
    );
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            Continue With Email
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>
      <div className="flex-col space-y-4">
        <Button
          disabled={loading}
          className="ml-auto w-full bg-slate-700"
          type="submit"
          onClick={() => router.push(`${BASE_URL}/auth/github/login`)}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            <div className="i-simple-icons:github h-4" />
            GitHub
          </span>
        </Button>
        <Button
          disabled={loading}
          className="ml-auto w-full bg-slate-500"
          type="submit"
          onClick={() => router.push(`${BASE_URL}/auth/microsoft/login`)}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            <div className="i-simple-icons:microsoft h-4" />
            Microsoft
          </span>
        </Button>
        <div className="flex items-center justify-center pt-4">
          <Turnstile siteKey={TURNSTILE_SITE_ID} onSuccess={setToken} />
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="bg-primary dark:bg-secondary absolute inset-0" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link to="/">
            <Logo className="h-8 invert-[.9] hover:invert" />
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="text-md space-y-2">
            <p className="text-slate-300">
              Complete, Curated, Cross-referenced, and Current Collection of
              Open Source Version Control Data.
            </p>
            <p className="text-slate-200">
              Get stratified samples from OSS, cross-project code flow,
              developer/code networks, do OSS census, get deforked repositories,
              aliased author IDs.
            </p>
            <p className="text-slate-100">
              Make study of global OSS properties not only possible, but fun.
            </p>
            {/* <footer className="text-sm">Sofia Davis</footer> */}
          </blockquote>
        </div>
      </div>
      <div className="flex h-full items-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in or Sign up
            </h1>
            <p className="text-muted-foreground text-sm">
              We'll create one if you don't have an account.
            </p>
          </div>
          <UserAuthForm />
          <p className="text-muted-foreground px-8 text-center text-sm">
            By clicking continue, you agree to our{' '}
            <Link
              to="/docs/#/terms"
              className="hover:text-primary underline underline-offset-4"
              target="_blank"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/docs/#/license"
              className="hover:text-primary underline underline-offset-4"
              target="_blank"
            >
              License
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
