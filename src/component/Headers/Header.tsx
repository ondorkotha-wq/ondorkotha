/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { FC, Suspense, useEffect, useMemo, useState } from "react";
import {
  Search,
  Menu,
  User,
  ChevronDown,
  ShoppingBag,
  X,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Heart,
} from "lucide-react";
import PromoBannerContainer from "./PromoBannerContainer";
import type {
  MobileMenuItem,
  MobileMenuContent,
  MegaMenuProps,
  MobileMenuDrawerProps,
} from "@/types/menu";
import AuthModal from "../Auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import LoadingDots from "../Loading/LoadingDS";
import { usePathname, useRouter } from "next/navigation";
import sampleData from "@/data/sampleData";
import useFetchNavItems from "@/hooks/useFetchNavitems";
import Link from "next/link";
import Image from "next/image";
import { MdDashboard } from "react-icons/md";
import useCartCount from "@/hooks/Cart/useCartCount";
import SearchComp from "./Search/SearchComp";
import useFetchCompany from "@/hooks/Company/useFetchCompany";

// Desktop MegaMenu Component (Unchanged)
const MegaMenu: FC<MegaMenuProps> = ({ data, image }) => {
  // console.log(data, "mega-menu-data");
  const [seriesImage, setSeriesImage] = useState<string | null | undefined>(
    null,
  );

  useEffect(() => {
    setSeriesImage(image);
  }, [image]);

  if (!data) return null;

  // console.log(data, "ddaaa", image);
  //
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZnVybml0dXJlfGVufDB8fDB8fHww";

  return (
    <div className="absolute left-0 right-0 top-full z-40 bg-white border-t border-gray-200 shadow-lg pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 flex gap-12">
        {data?.map((column, colIndex) => (
          <div
            key={colIndex}
            className={`
      w-1/4 px-8 
      ${colIndex !== data.length - 1 ? "border-r border-gray-200" : ""}
    `}
          >
            {/* Added border-b and extra pb-3 to create the separator line */}
            <h3 className="font-semibold text-gray-900 mb-3 text-sm border-b border-gray-200 pb-3">
              {column.title}
            </h3>
            <ul className="space-y-2 pt-3">
              {" "}
              {/* Added pt-3 for spacing after the line */}
              {column.links?.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <a
                    href={`${link.href}`}
                    className="text-gray-600 hover:text-amber-700 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {/* Placeholder for the side banner/image */}
        <div className="w-1/4">
          {seriesImage && (
            <Image
              src={`${seriesImage}`}
              alt="Mega Menu Banner"
              width={300}
              height={400}
              className="rounded-lg object-cover"
              onError={() => setSeriesImage(FALLBACK_IMAGE)}
            />
          )}
          {/* <div className="bg-teal-700 p-6 flex flex-col items-center justify-center h-full text-white text-center rounded">
            <p className="text-xl font-bold mb-2">EXTRA</p>
            <p className="text-4xl font-extrabold mb-4">50% OFF</p>
            <p className="text-xl font-bold">SALE</p>
          </div> */}

          {/* {data.image && (
              <Image
                src={`${data.image}`}
                alt="Mega Menu Banner"
                width={300}
                height={400}
                className="rounded-lg object-cover"
              />
            )} */}
        </div>
      </div>
    </div>
  );
};

type ActiveCategory = {
  name: string;
  slug: string;
} | null;

// --- MOBILE MENU DRILLDOWN COMPONENTS ---
const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  navItems,
  mobileMenuContent,
  isMenuOpen, // <-- Use this state to control the entire drawer's entry/exit
  setIsMenuOpen,
  isModalOpen,
  setIsModalOpen,
  token,
  logoutIcon,
  loading,
  handleAuthModal,
  // handleAuthModal
}) => {
  const [mobileActiveCategory, setMobileActiveCategory] =
    useState<ActiveCategory>(null);

  const [collapsibleStates, setCollapsibleStates] = useState<
    Record<string, boolean>
  >({});
  // const isLoggedIn = false;

  const activeCategoryData = mobileActiveCategory
    ? mobileMenuContent[mobileActiveCategory.slug]
    : null;

  const toggleCollapsible = (label: string) => {
    setCollapsibleStates((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const hasDrillDown = (item: string): boolean =>
    mobileMenuContent.hasOwnProperty(item);

  return (
    // Apply slide-in/out transition for the entire drawer based on isMenuOpen
    <div
      className={`lg:hidden fixed inset-0 z-50 bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${
        isMenuOpen ? "translate-x-0" : "translate-x-full" // Slides from right to left
      }`}
    >
      {/* Create a single sliding container for the two-panel drilldown effect */}
      <div
        className={`h-full flex w-[200%] transition-transform duration-300 ease-in-out ${
          mobileActiveCategory ? "-translate-x-1/2" : "translate-x-0" // Handles the slide between main and sub-menu
        }`}
      >
        {/* Panel 1: Main Menu List (Takes up 1/2 of 200% width = 100% viewport width) */}
        <div className="w-1/2 h-full shrink-0 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            {/* <h2 className="text-xl font-serif font-bold">Menu</h2> */}
            {/* The 'X' button closes the entire drawer */}
            <button onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="py-3 text-sm border-b border-gray-100 text-gray-900 font-semibold flex items-center gap-2 blue-link">
              {loading ? (
                <LoadingDots size="xs"></LoadingDots>
              ) : (
                <>
                  <span
                    onClick={handleAuthModal}
                    className="inline lg:hidden text-sm blue-link cursor-pointer"
                  >
                    {" "}
                    {token ? (
                      <span className="flex gap-2 item-center justify-center">
                        Dashboard
                        <MdDashboard size={20} />
                      </span>
                    ) : (
                      "Sign In / Sign Up"
                    )}
                  </span>
                  {token && (
                    <>
                      <span className="blue-link">|</span>
                      <span>{logoutIcon()}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {navItems?.map((item) => {
              const isSale = item.seriesType === "SALE";
              const isNewSeries = item.seriesType === "NEW";
              return (
                <Link
                  key={item.id}
                  href={
                    isSale
                      ? "/sales"
                      : hasDrillDown(item.slug)
                        ? "#"
                        : `/shop/${item.slug}`
                  }
                  className={`py-3 border-b border-gray-100 text-lg font-medium flex justify-between items-center ${
                    isSale
                      ? "text-red-500 hover:text-red-600"
                      : isNewSeries
                        ? "text-emerald-600 hover:text-emerald-700"
                        : "text-gray-700 hover:text-amber-700"
                  }`}
                  onClick={(e) => {
                    if (!isSale && hasDrillDown(item.slug)) {
                      e.preventDefault();
                      setMobileActiveCategory({
                        slug: item.slug,
                        name: item.name,
                      });
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                >
                  {item.name}
                  {hasDrillDown(item.slug) && (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Drilldown Sub-Category Panel (Takes up 1/2 of 200% width = 100% viewport width) */}
        <div className={`w-1/2 h-full shrink-0 bg-white p-6 overflow-y-auto`}>
          {/* Header: Back Button and Category Title */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => setMobileActiveCategory(null)}
              className="mr-4 text-gray-700 flex items-center"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-medium text-gray-900">
              {mobileActiveCategory?.name}
            </h2>
          </div>

          {/* Subcategory Links */}
          <div className="space-y-1">
            {activeCategoryData?.map((item, index) => {
              if (item.type === "link") {
                return (
                  <a
                    key={index}
                    href={`/shop/${mobileActiveCategory?.slug?.toLowerCase()}/${item.label
                      .toLowerCase()
                      .replace(/\s/g, "-")}`}
                    className="block py-3 text-gray-700 border-b border-gray-100 font-medium"
                  >
                    {item.label}
                  </a>
                );
              } else if (item.type === "collapsible") {
                const isExpanded =
                  collapsibleStates[item.label] ?? item.expanded;
                return (
                  <div key={index} className="border-b border-gray-100">
                    <button
                      onClick={() => toggleCollapsible(item.label)}
                      className="w-full py-3 text-gray-700 font-medium flex justify-between items-center"
                    >
                      {item.label}
                      <span className="text-xl font-bold text-gray-400">
                        {isExpanded ? "-" : "+"}
                      </span>
                    </button>
                    {isExpanded && (
                      <ul className="pl-4 pb-2 space-y-1">
                        {item.links?.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <a
                              href={link.href}
                              className="block py-1 text-gray-600 text-sm"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              } else if (item.type === "banner") {
                return (
                  <div key={index} className="mt-6">
                    <div className="bg-gray-100 p-8 rounded text-center">
                      <p className="font-serif text-xl font-bold">
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// MAIN HEADER COMPONENT
const Header = () => {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { cartCount, isLoading: isCartLoading } = useCartCount();
  const { company, isLoading: isCompanyLoading } = useFetchCompany();

  const router = useRouter();
  // Generate dynamic Navigation Items (Series names)

  const { navItems, isLoading } = useFetchNavItems();

  // console.log(navItems);
  // const navItems = useMemo(() => navbarDetails?.map((s) => s?.name), [navbarDetails]);

  const seriesSlugFromUrl = useMemo(() => {
    // Case 1: /series/[slug]
    if (pathname.startsWith("/series/")) {
      return pathname.split("/")[2];
    }

    // Case 2: /product-type/[slug]
    if (pathname.startsWith("/product-type/")) {
      const productTypeSlug = pathname.split("/")[2];

      // find which series owns this product-type
      const matchedSeries = navItems.find((series) =>
        series.categories?.some((cat) =>
          cat.subCategories?.some((sub) => sub.slug === productTypeSlug),
        ),
      );

      return matchedSeries?.slug ?? null;
    }

    return null;
  }, [pathname, navItems]);

  const derivedActiveNavItem = activeNavItem ?? seriesSlugFromUrl;

  // console.log(derivedActiveNavItem, "derivedActiveNavItem");

  const { token, logout, loading, setLoading } = useAuth();
  const axiosSecure = useAxiosSecure();

  useEffect(() => {
    setActiveNavItem(null);
    setHoveredItem(null);
  }, [pathname]);

  //   Generate dynamic Mobile Content
  const mobileMenuContent = useMemo(() => {
    const content: MobileMenuContent = {};
    navItems.forEach((series) => {
      content[series.slug] = series.categories?.map((cat) => ({
        type: "collapsible",
        label: cat.name,
        // cat.slug
        //   .split("-")
        //   ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        //   .join(" ")
        links:
          cat.subCategories?.map((sub) => ({
            label: sub.name,
            href: `/product-type/${sub.slug}`,
          })) ?? [],
        expanded: false,
      }));
    });
    return content;
  }, [navItems]);

  //   Generate dynamic Mega Menu Content (Desktop)
  const megaMenuContent = useMemo(() => {
    const activeSeries = navItems.find((s) => s.slug === hoveredItem);

    if (!activeSeries) return null;

    return activeSeries.categories?.map((cat) => ({
      title: cat?.name,
      links: cat.subCategories?.map((sub) => ({
        label: sub.name,
        href: `/product-type/${sub.slug}`,
      })),
    }));
  }, [hoveredItem, navItems]);

  const handleAuthModal = () => {
    token ? router.push("/dashboard") : setIsModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.post("/auth/logout");
      logout();
      setLoading(false);
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
    }
  };

  const logoutIcon = () => {
    return (
      <span
        onClick={handleLogout}
        className="flex gap-2 item-center justify-center text-red-500 cursor-pointer"
      >
        Logout
        <LogOut className="" size={20} />
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm bg-white">
      <PromoBannerContainer />

      <div
        className="border-b border-gray-200 sticky top-0 z-50 bg-white"
        onMouseLeave={() => {
          setActiveNavItem(null);
          setHoveredItem(null);
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row items-center justify-between mb-4">
            {/* Logo */}
            <Link
              href={"/"}
              className="text-2xl font-serif font-bold text-gray-900 tracking-wider"
            >
              {isCompanyLoading ? (
                <div className="h-10 w-28 rounded animate-pulse bg-gray-200" />
              ) : (
                <img
                  src={company?.logo || "/logo/ondorkotha-logo-2.png"}
                  alt={company?.name || "Company Logo"}
                  className="h-10 w-auto"
                />
              )}
            </Link>

            {/* Right Side Actions (unchanged for brevity) */}
            <div className="lg:w-fit w-full sm:gap-4 flex justify-between items-center">
              <Suspense>
                <SearchComp />
              </Suspense>

              <div className="flex items-center gap-4">
                <div className="hidden lg:flex text-gray-700 hover:text-amber-700 transition-colors gap-2">
                  {loading ? (
                    <LoadingDots size="xs"></LoadingDots>
                  ) : (
                    <>
                      <span
                        onClick={handleAuthModal}
                        className="hidden sm:inline text-sm blue-link cursor-pointer"
                      >
                        {token ? (
                          <span className="flex gap-2 item-center justify-center">
                            Dashboard
                            <MdDashboard size={20} />
                          </span>
                        ) : (
                          "Sign In / Sign Up"
                        )}
                      </span>
                      {token && (
                        <>
                          <span className="blue-link">|</span>
                          <span>{logoutIcon()}</span>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* wish icon */}
                <Link
                  href={"/wishlist"}
                  className="relative text-gray-700 hover:text-amber-700 transition-colors"
                >
                  <Heart size={20} />
                </Link>

                {/* cart */}
                <Link
                  href={"/cart"}
                  className="relative text-gray-700 hover:text-amber-700 transition-colors"
                >
                  {isCartLoading ? (
                    <ShoppingBag size={20} />
                  ) : (
                    <>
                      <ShoppingBag size={20} />

                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-medium">
                          {cartCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Full Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
            {!isLoading &&
              navItems.map((item) => {
                const isSale = item.seriesType === "SALE";
                const isNewSeries = item.seriesType === "NEW";
                const isActive = derivedActiveNavItem === item.slug;
                return (
                  <Link
                    key={item.id}
                    href={isSale ? "/sales" : `/series/${item.slug}`}
                    onMouseEnter={() => {
                      setHoveredItem(isSale || isNewSeries ? null : item.slug);
                    }}
                    className={`font-semibold heading text-xs relative border-b-2 pb-4
              ${
                isSale
                  ? isActive || pathname === "/sales"
                    ? "text-red-600 border-red-600"
                    : "text-red-500 hover:text-red-600 border-transparent"
                  : isNewSeries
                    ? "text-emerald-600 border-emerald-600"
                    : isActive
                      ? "text-amber-700 border-amber-700"
                      : "text-gray-700 hover:text-amber-700 border-transparent"
              }
            `}
                  >
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* Mega Menu Dropdown */}
          {megaMenuContent && (
            <MegaMenu
              data={megaMenuContent}
              image={navItems.find((s) => s.slug === hoveredItem)?.image}
            />
          )}

          {/* --- MOBILE NAVIGATION DRAWER (UPDATED PROPS) --- */}
          <MobileMenuDrawer
            navItems={navItems}
            mobileMenuContent={mobileMenuContent}
            isMenuOpen={isMenuOpen} // <--- Passed the state
            setIsMenuOpen={setIsMenuOpen}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            token={token}
            logoutIcon={logoutIcon}
            loading={loading}
            handleAuthModal={handleAuthModal}
          />
        </div>
      </div>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};

export default Header;
