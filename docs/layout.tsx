import React from 'react';
import NavBarLayout from '../src/layouts/navbar-layout';

export default function Layout({ children }) {
  return <NavBarLayout>{children}</NavBarLayout>;
}
