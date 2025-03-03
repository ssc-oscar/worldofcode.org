import type { HomePageItem, NavItem } from './types';

/** Backend base url */
export const BASE_URL =
  (import.meta.env.VITE_BASE_URL as string) || 'http://localhost:8234';

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
    label: 'Docs'
  },
  {
    title: 'Lookup',
    href: '/lookup',
    icon: 'i-material-symbols:category-search',
    label: 'Lookup'
  },
  {
    title: 'Sample',
    href: '/sample',
    icon: 'i-material-symbols:lab-research',
    label: 'Sample'
  },
  {
    title: 'Explore',
    href: '/explore',
    icon: 'i-material-symbols:graph-3',
    label: 'Explore'
  },
  {
    title: 'DevDash',
    href: '/devdash',
    icon: 'i-material-symbols:person-play-outline',
    label: 'DevDash'
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
    description: 'Next World of Code Hackathon: \n Nov 17-19, Knoxville, TN',
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
];
