export interface HomePageItem {
  /** Title of a home page tile */
  title?: string;
  /** Description of a home page tile. Unlike title, it is required. */
  description: string;
  /** The URL of the optional link. */
  linkHref?: string;
  /* By default, it is "learn more" */
  linkText?: string;
  /** Extra link attribute applied to the link */
  linkClassName?: string;
  /** Icon can be a emoji, an asset url, or a unocss icon className (e.g. i-fluent-emoji-flat:world-map) */
  icon: string;
  /** Extra className attribute applied to the icon */
  iconClassName?: string;
}

export interface NavItem {
  /** Title of a navbar item */
  title: string;
  /** Link of a navbar item */
  href: string;
  /** An attribute to disable a navbar item. This is reserved to display some buttons only to logged in users */
  disabled?: boolean;
  /** An attribute to open a link in a new tab by setting target=_blank */
  external?: boolean;
  /** Icon can be a emoji, an asset url, or a unocss icon className (e.g. i-fluent-emoji-flat:world-map) */
  icon?: string;
  /** Description text shown in the tooltip */
  description?: string;
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

/** Backend base url */
export const BASE_URL = '/api';
// (import.meta.env.VITE_BASE_URL as string) || 'http://localhost:8234';

/** Turnstile site id */
export const TURNSTILE_SITE_ID =
  (import.meta.env.VITE_TURNSTILE_SITE_ID as string) ||
  '1x00000000000000000000AA';

/** Bibtex citation for the project */
export const CITATION = `@article{ma2021world,
  title = {World of code: Enabling a research workflow for mining and analyzing the universe of open source vcs data},
  author = {Ma, Yuxing and Dey, Tapajit and Bogart, Chris and Amreen, Sadika and Valiev, Marat and Tutko, Adam and Kennard, David and Zaretzki, Russell and Mockus, Audris},
  journal = {Empirical Software Engineering},
  volume = {26},
  number = {2},
  pages = {1--42},
  year = {2021},
  publisher = {Springer}
}`;

export const navItems: NavItem[] = [
  {
    title: 'Docs',
    href: '/docs/',
    icon: 'i-material-symbols:book-5-rounded',
    description: 'Comprehensive World of Code Documentation Collection'
  },
  {
    title: 'Lookup',
    href: '/lookup',
    icon: 'i-material-symbols:category-search',
    description: 'An interactive playground for World of Code API'
  },
  {
    title: 'Sample',
    href: '/sample',
    icon: 'i-material-symbols:lab-research',
    description: 'Sample Projects, Authors and more'
  },
  {
    title: 'Explore',
    href: '/explore',
    icon: 'i-material-symbols:graph-3',
    description: 'Explore the World of Code with Graph Visualization'
  },
  {
    title: 'DevDash',
    href: '/devdash',
    icon: 'i-material-symbols:person-play-outline',
    description: 'Developer Dashboard'
  }
  // {
  //   title: 'APIDoc',
  //   href: 'http://localhost:8234/docs',
  //   icon: 'i-material-symbols:api',
  //   label: 'APIDoc'
  // }
];

export const homePageItems: HomePageItem[] = [
  {
    description:
      'Complete, Curated, Cross-referenced, and Current Collection of Open Source Version Control Data.',
    icon: 'i-fluent-emoji-flat:world-map'
  },
  {
    description:
      'Get stratified samples from OSS, cross-project code flow, developer/code networks, and more.',
    icon: 'i-fluent-emoji-flat:test-tube'
  },
  {
    description:
      'Make study of global OSS properties not only possible, but approachable and fun.',
    icon: 'i-fluent-emoji-flat:cat-with-wry-smile'
  },
  {
    description: 'Next World of Code Hackathon: \n Late May - Early Jun (TBD)',
    icon: 'i-fluent-emoji-flat:calendar',
    linkHref: 'https://github.com/woc-hack/hackathon-knoxville-2023',
    linkText: 'Register Now',
    linkClassName: 'bg-red-500 animate-pulse'
  },
  {
    description: 'General World of Code Infrastructure Overview',
    icon: 'i-fluent-emoji-flat:gear',
    linkHref: '/explore',
    linkText: 'Explore'
  },
  {
    description: `Essence of World of Code: \n Elements and Structure`,
    icon: 'i-fluent-color:video-32',
    linkHref: 'https://youtu.be/c0uFPwT5SZI',
    linkText: 'Watch on YouTube'
  },
  {
    description: `Fun facts about some crazy competitions among git repositories`,
    icon: '😂',
    linkHref: 'https://osslab-pku.org',
    linkText: 'Learn More'
  },
  {
    description: `Peking University OSS Lab`,
    icon: 'pku_logo.webp',
    linkHref: 'https://osslab-pku.org',
    linkText: 'Learn More'
  }
]; /** Items shown in the NavBar */
