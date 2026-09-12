import {
  FolderOpen,
  Link2,
  CalendarClock,
  TrendingUp,
  BarChart3,
  FileUp,
  CloudUpload,
  ListOrdered,
  Send,
  LineChart,
  type LucideIcon,
} from "lucide-react";

export interface MarketplaceLogo {
  src: string;
  alt: string;
}

/** Marketplace logos — add new entries here to show them everywhere. */
export const marketplaceLogos: MarketplaceLogo[] = [
  { src: "/logos/afternic.png", alt: "Afternic" },
  { src: "/logos/spaceship.png", alt: "Spaceship" },
  { src: "/logos/atom.png", alt: "Atom" },
  { src: "/logos/sedo.png", alt: "Sedo" },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const features: Feature[] = [
  {
    icon: FolderOpen,
    title: "Portfolio Management",
    text: "Import thousands of domains and keep registrar, price, expiry, tags and notes organized in one place.",
  },
  {
    icon: Link2,
    title: "Marketplace Automation",
    text: "Publish to Sedo, Spaceship, Atom and other channels automatically.",
  },
  {
    icon: CalendarClock,
    title: "Expiry Monitoring",
    text: "Get notified before domains expire and never lose a valuable domain.",
  },
  {
    icon: TrendingUp,
    title: "Sales & Revenue",
    text: "Track sales, revenue, acquisition costs and ROI across your entire portfolio.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "Make data-driven decisions with detailed reports and performance insights.",
  },
  {
    icon: FileUp,
    title: "CSV Import",
    text: "Quickly import your portfolio from CSV files or add domains manually.",
  },
];

export const workflowSteps: Feature[] = [
  {
    icon: CloudUpload,
    title: "Import",
    text: "Import your portfolio from CSV or add domains manually.",
  },
  {
    icon: ListOrdered,
    title: "Organize",
    text: "Track cost, registrar, expiry, category, price and notes.",
  },
  {
    icon: Send,
    title: "Publish",
    text: "Choose your marketplaces and publish domains automatically.",
  },
  {
    icon: LineChart,
    title: "Track",
    text: "Monitor listings, sales, revenue and ROI.",
  },
  {
    icon: TrendingUp,
    title: "Grow",
    text: "Use analytics to understand which domains and marketplaces perform best.",
  },
];

export const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#marketplaces", label: "Marketplaces" },
  { href: "#pricing", label: "Pricing" },
];
