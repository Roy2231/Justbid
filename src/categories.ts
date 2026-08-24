export interface CategoryItem {
  id: string;
  name: string;
  shortName: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES: CategoryItem[] = [
  { 
    id: 'All', 
    name: 'All Categories', 
    shortName: 'All', 
    iconName: 'LayoutGrid',
    color: 'text-zinc-900',
    bgColor: 'bg-zinc-100',
    borderColor: 'border-zinc-300'
  },
  { 
    id: 'SEO & AI Visibility', 
    name: 'SEO & AI Visibility', 
    shortName: 'SEO', 
    iconName: 'Search',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  { 
    id: 'AI Agents & Infrastructure', 
    name: 'AI Agents & Infrastructure', 
    shortName: 'Agents', 
    iconName: 'Bot',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  { 
    id: 'AI Media Generation', 
    name: 'AI Media Generation', 
    shortName: 'AI Media', 
    iconName: 'Sparkles',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  { 
    id: 'Marketing & Advertising', 
    name: 'Marketing & Advertising', 
    shortName: 'Marketing', 
    iconName: 'Megaphone',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  { 
    id: 'Developer Tools', 
    name: 'Developer Tools', 
    shortName: 'DevTools', 
    iconName: 'Code',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    id: 'Productivity & Personal Tools', 
    name: 'Productivity & Personal Tools', 
    shortName: 'Productivity', 
    iconName: 'CheckSquare',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  { 
    id: 'People & Profiles', 
    name: 'People & Profiles', 
    shortName: 'People', 
    iconName: 'Users',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  { 
    id: 'Design & Creative', 
    name: 'Design & Creative', 
    shortName: 'Design', 
    iconName: 'Palette',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200'
  },
  { 
    id: 'Social Media & Creator Tools', 
    name: 'Social Media & Creator Tools', 
    shortName: 'Creators', 
    iconName: 'Share2',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200'
  },
  { 
    id: 'Writing & Content', 
    name: 'Writing & Content', 
    shortName: 'Writing', 
    iconName: 'PenTool',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  { 
    id: 'Sales & Lead Generation', 
    name: 'Sales & Lead Generation', 
    shortName: 'Sales', 
    iconName: 'Target',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  { 
    id: 'Business, Finance & Legal', 
    name: 'Business, Finance & Legal', 
    shortName: 'Finance', 
    iconName: 'Scale',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  { 
    id: 'Games & Entertainment', 
    name: 'Games & Entertainment', 
    shortName: 'Games', 
    iconName: 'Gamepad2',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  { 
    id: 'Education & Learning', 
    name: 'Education & Learning', 
    shortName: 'Education', 
    iconName: 'GraduationCap',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  },
  { 
    id: 'Health, Fitness & Wellness', 
    name: 'Health, Fitness & Wellness', 
    shortName: 'Health', 
    iconName: 'Heart',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  { 
    id: 'Ecommerce & Retail', 
    name: 'Ecommerce & Retail', 
    shortName: 'Ecommerce', 
    iconName: 'ShoppingCart',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200'
  },
  { 
    id: 'Directories, Launch & Discovery', 
    name: 'Directories, Launch & Discovery', 
    shortName: 'Launch', 
    iconName: 'Compass',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200'
  },
  { 
    id: 'Hiring, Jobs & Careers', 
    name: 'Hiring, Jobs & Careers', 
    shortName: 'Hiring', 
    iconName: 'Briefcase',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  { 
    id: 'Audio, Voice & Podcasting', 
    name: 'Audio, Voice & Podcasting', 
    shortName: 'Audio', 
    iconName: 'Mic',
    color: 'text-fuchsia-700',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200'
  },
  { 
    id: 'Crypto, Web3 & Investing', 
    name: 'Crypto, Web3 & Investing', 
    shortName: 'Crypto', 
    iconName: 'Coins',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  { 
    id: 'Agencies, Studios & Services', 
    name: 'Agencies, Studios & Services', 
    shortName: 'Agencies', 
    iconName: 'Building',
    color: 'text-stone-700',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200'
  },
  { 
    id: 'Security, Privacy & Compliance', 
    name: 'Security, Privacy & Compliance', 
    shortName: 'Security', 
    iconName: 'Shield',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    id: 'Travel, Local & Lifestyle', 
    name: 'Travel, Local & Lifestyle', 
    shortName: 'Travel', 
    iconName: 'MapPin',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200'
  },
  { 
    id: 'Media & News', 
    name: 'Media & News', 
    shortName: 'Media', 
    iconName: 'Newspaper',
    color: 'text-zinc-700',
    bgColor: 'bg-zinc-50',
    borderColor: 'border-zinc-200'
  },
  { 
    id: 'Domains & Web Assets', 
    name: 'Domains & Web Assets', 
    shortName: 'Domains', 
    iconName: 'Globe',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

export const PRIMARY_CHIPS = [
  'All',
  'SEO & AI Visibility',
  'AI Agents & Infrastructure',
  'AI Media Generation',
  'Marketing & Advertising',
  'Developer Tools',
  'Productivity & Personal Tools'
];
