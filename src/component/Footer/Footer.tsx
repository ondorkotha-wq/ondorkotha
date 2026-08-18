"use client";

import { useState, type ReactNode } from "react";
import {
  Mail,
  User,
  Phone,
  MapPin,
  Gift,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import useFetchCompany from "@/hooks/Company/useFetchCompany";
import { CompanyInfo } from "@/types/company";

// --- FOOTER DATA ---
type FooterLink = { label: string; href?: string };

const footerData: { title: string; links: FooterLink[] }[] = [
  {
    title: "Help",
    links: [
      { label: "Track Your Order", href: "/help/order-tracking" },
      { label: "Start a Return Or Exchange", href: "/refund" },
      { label: "Returns & Exchanges", href: "/pages/return-policy" },
      { label: "Customer Service", href: "/help/help-center" },
      { label: "Check Gift Card Balance", href: "/pages/gift-card-balance" },
      { label: "Current Promotions", href: "/sales" },
    ],
  },
  {
    title: "About Us",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Diversity & Inclusion", href: "/pages/diversity-inclusion" },
      { label: "Careers", href: "/pages/careers" },
      { label: "Our Impact", href: "/pages/our-impact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Styling Services", href: "/pages/styling-services" },
      { label: "Gift Cards", href: "/pages/gift-cards" },
      { label: "Registry", href: "/pages/registry" },
      { label: "Free Design Services & Guides", href: "/pages/design-services" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Events", href: "/pages/events" },
      { label: "Contact Us", href: "/help/contact-us" },
      { label: "Stories", href: "/blogs" },
    ],
  },
];

// Icons for the fourth column (Desktop view only)
const desktopConnectIcons = [
  { label: "Store Locator", icon: MapPin, href: "/pages/store-locator" },
  { label: "Rewards", icon: Gift, href: "/pages/rewards" },
  { label: "Sign Up For Texts", icon: Phone, href: "/pages/sms-signup" },
  { label: "Chat With Us", icon: MessageCircle, href: "/help/contact-us" },
];

// countries for bottom links — this business operates in one country, so
// these are decorative (all point home) rather than a real locale switcher.
const countries = ["US", "Canada", "France", "Germany", "Italy", "Spain", "UK"];

// legal links for bottom links
const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

// Social links — only rendered when the admin has set a real URL in Company settings
function getSocialLinks(company?: CompanyInfo) {
  if (!company) return [];
  const all = [
    { name: "Facebook", href: company.facebook, icon: <Facebook size={26} /> },
    { name: "Instagram", href: company.instagram, icon: <Instagram size={26} /> },
    { name: "YouTube", href: company.youtube, icon: <Youtube size={26} /> },
    { name: "TikTok", href: company.tiktok, icon: <FaTiktok size={22} /> },
    { name: "Twitter", href: company.twitter, icon: <Twitter size={26} /> },
    { name: "LinkedIn", href: company.linkedin, icon: <Linkedin size={26} /> },
  ];
  return all.filter((s) => Boolean(s.href)) as {
    name: string;
    href: string;
    icon: ReactNode;
  }[];
}

// --- REUSABLE COMPONENTS ---

// 1. Mobile Collapsible Section
const MobileCollapsible: React.FC<{ title: string; links: FooterLink[] }> = ({
  title,
  links,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex justify-between items-center text-gray-800 font-medium"
      >
        <span className="text-base">{title}</span>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>
      {isOpen && (
        <ul className="pb-4 space-y-2 text-sm text-gray-600">
          {links?.map((link, index) => (
            <li key={index}>
              <a href={link.href ?? "#"} className="hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// 2. Email Sign Up Section
const EmailSignUp: React.FC = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="py-8 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end">
          <div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              Sign Up For Email
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-lg">
              Receive early access to new arrivals, sales, exclusive content,
              events and much more!
            </p>
          </div>

          <form className="flex flex-col md:flex-row gap-4 mb-4 md:mb-6 items-start">
            <div className="w-full md:w-80">
              <label htmlFor="email" className="sr-only">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email Address*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 focus:ring-0 focus:border-gray-500 outline-none text-sm text-gray-900"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-32 px-4 py-3 bg-gray-700 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              SUBMIT
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-500">
          By signing up, you will receive Ondorkotha offers, promotions, and other
          commercial messages. You are also agreeing to Ondorkotha&apos;s{" "}
          <a href="/privacy-policy" className="underline hover:text-gray-700">
            Privacy Policy
          </a>
          . You may unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

// 3. SMS/App Banner Section
const SmsAppBanner: React.FC = () => (
  <div className="bg-[#b3705a] w-full mt-8">
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-white text-center sm:text-left">
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <h4 className="text-xl font-bold uppercase whitespace-nowrap">
          Get the message!
        </h4>
        <p className="text-sm">
          sign up for SMS texts for **INSTANT** access to new arrivals, events &
          OMG sales
        </p>
      </div>
      <Link
        href="/pages/sms-signup"
        className="flex items-center text-sm font-semibold mt-4 sm:mt-0 whitespace-nowrap"
      >
        RIGHT THIS WAY
        <span className="ml-2">&rarr;</span>
      </Link>
    </div>
  </div>
);

// 4. Social Media & App Download Links
const SocialAndAppLinks: React.FC<{
  socials: { name: string; href: string; icon: ReactNode }[];
}> = ({ socials }) => (
  <div className="flex flex-col md:flex-row justify-center lg:gap-4 items-center py-6">
    {/* App Store Image */}
    <Link href="/pages/mobile-app" className="mb-4 md:mb-0 inline-block">
      <Image
        src="/icons/download-from-apple.svg"
        alt="Download on the App Store"
        width={100}
        height={60}
      />
    </Link>

    {/* Social Icons */}
    {socials.length > 0 && (
      <div className="flex space-x-6 text-gray-700">
        {socials.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.name}
            className="hover:text-amber-700 transition-colors"
          >
            {item.icon}
          </a>
        ))}
      </div>
    )}
  </div>
);

// --- MAIN FOOTER COMPONENT ---
const Footer: React.FC = () => {
  const { company } = useFetchCompany();
  const socials = getSocialLinks(company);

  return (
    <footer className="bg-stone-100 text-gray-800 pt-8 border-t border-stone-200 ">
      <div className="max-w-7xl mx-auto">
        <EmailSignUp />

        {/* Mid-Section: Navigation Columns */}
        <div className="px-4">
          {/* Desktop Navigation Columns (Grid Layout) */}
          <div className="w-full flex flex-col-reverse lg:flex-row lg:pb-10 lg:pt-10 justify-around">
            <div className="hidden lg:grid grid-cols-4 gap-8 justify-around">
              {footerData?.map((section, index) => (
                <div key={index}>
                  <h4 className="heading text-gray-900 mb-4 text-sm font-semibold">
                    {section.title}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {section.links?.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a
                          href={link.href ?? "#"}
                          className="hover:underline text-[12px]"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Desktop Connect Column (Icons) */}
            <div>
              <ul className=" space-y-4 text-sm text-gray-600 flex flex-col justify-center items-center lg:items-start">
                {desktopConnectIcons?.map((item, index) => (
                  <li
                    key={index}
                    className="border-b-2 lg:border-b-0 border-gray-200 w-full lg:w-fit py-4 lg:py-0 "
                  >
                    <a
                      href={item.href}
                      className="heading flex justify-center items-center hover:text-amber-700 transition-colors blue-link text-xs"
                    >
                      <item.icon size={20} className="mr-3 text-gray-500" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile Collapsible Navigation (Stack) */}
          <div className="lg:hidden">
            {footerData?.map((section, index) => (
              <MobileCollapsible
                key={index}
                title={section.title}
                links={section.links}
              />
            ))}
          </div>

          <SocialAndAppLinks socials={socials} />
        </div>

        {/* Bottom Banner */}
        <SmsAppBanner />

        {/* Bottom Footer Links and Copyright */}
        <div className="py-4 text-xs text-gray-500 border-t border-gray-200">
          {/* Contact info */}
          {(company?.phone || company?.email || company?.address) && (
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6 pb-2 text-gray-600">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Phone size={12} />
                  {company.phone}
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Mail size={12} />
                  {company.email}
                </a>
              )}
              {company.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {[company.address, company.city, company.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Country Links */}
          <div className="flex flex-wrap justify-center mb-2 lg:mb-0 pb-8 space-y-2">
            {countries?.map((country, idx) => (
              <Link
                key={country}
                href="/"
                className={`hover:underline px-4 ${
                  idx !== countries.length - 1 ? "border-r border-gray-300" : ""
                }`}
              >
                {country}
              </Link>
            ))}
          </div>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="max-w-7xl mx-auto lg:mx-0 px-4 flex flex-wrap justify-center lg:justify-between items-center">
              {/* Legal Links (Responsive: stacked on mobile, in line on desktop) */}
              <div className="flex flex-row flex-wrap sm:space-y-0 sm:space-x-3 sm:text-left space-y-2 items-center justify-center ">
                {legalLinks?.map((link, idx) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`hover:underline blue-link px-2 ${idx != legalLinks.length - 1 ? "border-gray-200 border-r-2" : ""}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="text-center mt-2 text-xs">
              © {new Date().getFullYear()} {company?.name ?? "Ondorkotha"}. All
              Rights Reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
        aria-label="Back to Top"
        className="fixed bottom-4 right-4 bg-gray-900 hover:bg-gray-700 text-white p-1 md:p-2 lg:p-3 rounded-full shadow-lg transition-colors z-40"
      >
        <ChevronUp size={24} />
      </button>
    </footer>
  );
};

export default Footer;
