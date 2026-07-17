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
  '0x4AAAAAABAAjR426fIx0uMm';

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
    description: 'Comprehensive World of Code Documentation Collection',
    external: true
  },
  {
    title: 'DRS',
    href: '/drs',
    icon: 'i-material-symbols:security',
    description: 'DRS-OSS — LLM pull-request bug-risk scoring',
    external: true
  },
  {
    title: 'Impact',
    href: '/impact',
    icon: 'i-material-symbols:hub-outline',
    description: 'Impact Explorer — reciprocal impact of software and science'
  },
  {
    title: 'Catalog',
    href: '/catalog',
    icon: 'i-material-symbols:database-outline',
    description: 'Data Catalog — every WoC table, its schema, and how to read it'
  },
  {
    title: 'Backports',
    href: '/mozdemo',
    icon: 'i-material-symbols:track-changes',
    description: 'Backport provenance — when a vendored fix landed, who adopted it, who is still exposed'
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

export const updateBanner = {
  text: 'V2604 now available (March 2026 data, 5.9B commits). All servers on RHEL9.',
  linkHref: '/docs/#/updates.md',
  linkText: 'Details',
  highlights: [
    {
      icon: 'i-material-symbols:bolt-outline',
      text: 'Near-real-time data gathering — an hourly streaming pipeline (GH Archive → LMDB) is replacing batch dumps (gather_new).'
    },
    {
      icon: 'i-material-symbols:layers-outline',
      text: 'A layered object store brings incremental, append-only updates without full rebuilds (lookup).'
    },
    {
      icon: 'i-material-symbols:speed-outline',
      text: 'libgit2-woc: faster C commit-diff extraction over the layered store (~7–8× vs. the previous tooling).'
    }
  ]
};

export const useCaseItems: HomePageItem[] = [
  {
    title: 'Researchers',
    description:
      'Move beyond convenience sampling. Select from the entire OSS population for natural experiments, supply chain analysis, and technology adoption studies.',
    icon: 'i-fluent-emoji-flat:test-tube',
    linkHref: '/docs/#/capabilities',
    linkText: 'See Use Cases'
  },
  {
    title: 'Security',
    description:
      'Trace vulnerable code across all repositories — even when copied, not installed as a package. Search all commits for CVEs. Audit transitive dependencies at ecosystem scale.',
    icon: 'i-fluent-emoji-flat:locked-with-key',
    linkHref: 'https://worldofcode.org/drs',
    linkText: 'Try DRS-OSS'
  },
  {
    title: 'Developers',
    description:
      'See which projects use your code. Find experts for specific APIs or codebases. Discover related projects through shared code and contributors.',
    icon: 'i-fluent-emoji-flat:hammer-and-wrench',
    linkHref: '/devdash',
    linkText: 'Developer Dashboard'
  }
];

export const tryItItems: HomePageItem[] = [
  {
    title: 'Lookup',
    description: 'Query any commit, blob, author, or project interactively.',
    icon: 'i-material-symbols:category-search',
    linkHref: '/lookup',
    linkText: 'Try It'
  },
  {
    title: 'Sample',
    description: 'Draw stratified random samples from the full OSS population.',
    icon: 'i-material-symbols:lab-research',
    linkHref: '/sample',
    linkText: 'Try It'
  },
  {
    title: 'Explore',
    description: 'Visualize relationships between projects, authors, and code.',
    icon: 'i-material-symbols:graph-3',
    linkHref: '/explore',
    linkText: 'Try It'
  }
];

export const learnMoreItems: HomePageItem[] = [
  {
    title: 'Tutorial',
    description: 'Hands-on setup: shell lookups, Python API, MongoDB, ClickHouse, and the web API.',
    icon: 'i-fluent-emoji-flat:world-map',
    linkHref: '/docs/#/tutorial',
    linkText: 'Start Tutorial'
  },
  {
    title: 'Python Driver',
    description: 'Install python-woc and access WoC data locally or via the HTTP API.',
    icon: 'i-simple-icons:python',
    linkHref: 'https://ssc-oscar.github.io/python-woc/',
    linkText: 'Documentation'
  },
  {
    title: 'Video Overview',
    description: 'Watch a walkthrough of WoC elements and structure.',
    icon: 'i-fluent-color:video-32',
    linkHref: 'https://youtu.be/c0uFPwT5SZI',
    linkText: 'Watch on YouTube'
  },
  {
    title: 'Fun Facts',
    description: 'The longest commit chain is 9.96M deep. The empty blob appears in 153M commits.',
    icon: '😂',
    linkHref: '/docs/#/crazy',
    linkText: 'See All'
  },
  {
    title: 'Register',
    description: 'Request access to WoC servers for direct data access.',
    icon: 'i-fluent-emoji-flat:calendar',
    linkHref:
      'https://docs.google.com/forms/d/e/1FAIpQLSd4vA5Exr-pgySRHX_NWqLz9VTV2DB6XMlR-gue_CQm51qLOQ/viewform?vc=0&c=0&w=1&flr=0&usp=mail_form_link',
    linkText: 'Sign Up'
  },
  {
    title: 'Discord',
    description: 'Join the community for updates, questions, and hackathon announcements.',
    icon: 'i-simple-icons:discord',
    linkHref: 'https://discord.gg/fKPFxzWqZX',
    linkText: 'Join'
  }
];
