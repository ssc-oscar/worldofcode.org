/** Items shown in the NavBar */
export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: string;
  label?: string;
  description?: string;
}

export type EmojiOrIconString = string | `i-${string}`;

/** Items on the homepage.
 *  Icon can be a emoji character or a unocss icon className (https://unocss.dev/presets/icons) */
export interface HomePageItem {
  title?: string;
  description: string;
  linkHref?: string;
  linkText?: string;
  linkClassName?: string;
  icon: EmojiOrIconString;
  iconClassName?: string;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
