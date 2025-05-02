import Logo from '@/components/logo';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { useEffect, useState, useRef } from 'react';
import { BASE_URL, TURNSTILE_SITE_ID } from '@/config';
import { Turnstile } from '@marsidev/react-turnstile';
import { sendVerificationEmail } from '@/api/auth';
import { parseError } from '@/lib/error';

export function UserAuthForm({
  setEmailSent
}: {
  setEmailSent?: (value: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();
  useEffect(() => {
    if (errors.email) {
      toast({
        title: 'Error',
        description: String(errors.email.message),
        variant: 'destructive'
      });
    }
  }, [errors.email]);

  const onSubmit = handleSubmit(async (data) => {
    if (loading) return;
    if (!turnstileToken) {
      setLoading(false);
      toast({
        title: 'Captcha Error',
        description: 'Please verify you are not a robot',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      console.log('data', data);
      await sendVerificationEmail(data.email, turnstileToken);
    } catch (error) {
      const err_obj = parseError(error);
      toast(err_obj);
      if (err_obj.description === 'reCAPTCHA validation failed.') {
        console.log('resetting captcha');
        // reset captcha
        turnstileRef.current?.reset();
      }
    } finally {
      setLoading(false);
    }
    // redirect
    setEmailSent?.(true);
  });

  const onOauthRedirect = (provider: string) => {
    if (loading) return;
    if (!turnstileToken) {
      setLoading(false);
      toast({
        title: 'Captcha Error',
        description: 'Please verify you are not a robot',
        variant: 'destructive'
      });
      return;
    }
    // redirect
    setLoading(true);
    window.location.href = `${BASE_URL}/auth/${provider}/login?cf_turnstile_response=${turnstileToken}`;
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="w-full space-y-2">
          <Input
            {...register('email')}
            type="email"
            placeholder="Enter your email..."
            disabled={loading}
            required
          />
          <Button
            disabled={loading}
            className="dark:bg-slate-2 ml-auto w-full"
            type="submit"
          >
            Continue With Email
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          {loading ? (
            <span className="bg-background text-muted-foreground animate-pulse px-2">
              Loading
            </span>
          ) : (
            <span className="bg-background text-muted-foreground px-2">
              Or continue with
            </span>
          )}
        </div>
      </div>
      <div className="flex-col space-y-4">
        <Button
          disabled={loading}
          className="dark:bg-slate-3 ml-auto w-full bg-slate-700"
          type="submit"
          onClick={() => onOauthRedirect('github')}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            <div className="i-simple-icons:github h-4" />
            GitHub
          </span>
        </Button>
        <Button
          disabled={loading}
          className="dark:bg-slate-4 hover:dark:bg-slate-3 ml-auto w-full bg-slate-500 hover:bg-slate-600"
          type="submit"
          onClick={() => onOauthRedirect('microsoft')}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            <div className="i-simple-icons:microsoft h-4" />
            Microsoft
          </span>
        </Button>
        <div className="flex h-[65px] items-center justify-center pt-4">
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_ID}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken('')}
            className="h-[65px] w-[300px]"
          />
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  const [emailSent, setEmailSent] = useState(false);
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
        <div className="dark:bg-foreground/10 bg-primary absolute inset-0" />
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
        {emailSent ? (
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="i-line-md:email-check-twotone text-primary size-24" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Email Sent!
              </h1>
              <p className="text-muted-foreground text-sm">
                We've sent you a link to sign in. Please check your junk folder
                if you don't see it in your inbox. Start over if you need to
                resend the email.
              </p>
            </div>
            <Button className="w-full" onClick={() => setEmailSent(false)}>
              Start Over
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in or Sign up
              </h1>
              <p className="text-muted-foreground text-sm">
                We'll create one if you don't have an account.
              </p>
            </div>
            <UserAuthForm setEmailSent={setEmailSent} />
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
        )}
      </div>
    </div>
  );
}
