import NavbarLayout from '@/layouts/navbar-layout';
import { Outlet } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';

const components = {
  wrapper: ({ children }) => (
    <div className="prose prose-sm m-auto text-left">{children}</div>
  ),
  a: ({ href, children, ...props }) => {
    const isExternal = /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener" {...props}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
};

export const MDXWrapper = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);

export default function BlogLayout() {
  return (
    <NavbarLayout>
      {/* A page-like component that renders its nested routes */}
      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center">
        <MDXWrapper>
          <Outlet />
        </MDXWrapper>
      </main>
    </NavbarLayout>
  );
}
