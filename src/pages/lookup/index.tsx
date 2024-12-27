import { useGetTree, useGetBlob, useGetCommit } from '@/api/lookup';
import NavbarLayout from '@/layouts/navbar-layout';
import { useRouter } from '@/hooks/use-router';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';

export function UserAuthForm() {
  const router = useRouter();
  const [loading] = useState(false);
  const defaultValues = {
    email: 'demo@gmail.com'
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    console.log('data', data);
    router.push('/');
  };

  const { toast } = useToast();

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
          onClick={() => router.push('/auth/github')}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            <Icons.gitHub className="h-[1.45em]" />
            GitHub
          </span>
        </Button>
        <Button
          disabled={loading}
          className="ml-auto w-full bg-slate-500"
          type="submit"
          onClick={() => toast({ description: 'Coming soon' })}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            <Icons.microsoft className="h-4" />
            Microsoft
          </span>
        </Button>
      </div>
    </>
  );
}

export default function LookupPage() {
  const { data: tree } = useGetTree('HEAD', false);
  const { data: commit } = useGetCommit(tree?.hash);
  const { data: blob } = useGetBlob(commit?.tree);

  return (
    <NavbarLayout>
      <div>
        <h1>Lookup</h1>
        <pre>{JSON.stringify(tree, null, 2)}</pre>
        <pre>{JSON.stringify(commit, null, 2)}</pre>
        <pre>{blob}</pre>
      </div>
    </NavbarLayout>
  );
}
