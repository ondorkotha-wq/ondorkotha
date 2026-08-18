"use client";

import { useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  Ruler,
  Filter,
} from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  // Delivery & Tracking
  {
    id: 1,
    question: "When will I receive my delivery?",
    answer:
      "Once your order is confirmed, delivery usually takes 3 to 10 working days. The exact time depends on the product and your location — deliveries within the city are typically faster, while remote areas may take a bit longer.",
    category: "Delivery & Tracking",
    tags: ["delivery", "timeline"],
  },
  {
    id: 2,
    question: "How can I track my order?",
    answer:
      "You can track your order anytime from your account dashboard. You're also welcome to call our support hotline with your order number, and we'll update you on the status.",
    category: "Delivery & Tracking",
    tags: ["tracking", "order status"],
  },
  {
    id: 3,
    question: "How much does delivery cost?",
    answer:
      "Delivery charges depend on your location, along with the product's size, weight, and volume. Larger furniture pieces may have an additional charge, including a possible floor delivery fee. We'll always confirm the exact delivery cost with you before your order is finalized.",
    category: "Delivery & Tracking",
    tags: ["delivery cost", "shipping charge"],
  },

  // Payment
  {
    id: 4,
    question: "Do you offer Cash on Delivery?",
    answer: "Yes, Cash on Delivery is available on our store.",
    category: "Payment",
    tags: ["cash on delivery", "cod"],
  },
  {
    id: 5,
    question: "Can I pay in installments (EMI)?",
    answer: "We don't currently offer EMI or installment payment options.",
    category: "Payment",
    tags: ["emi", "installments"],
  },

  // Product Info
  {
    id: 6,
    question: "How do I know if a product will fit my space?",
    answer:
      "Every product page includes detailed measurements — length, width, and height — along with material and color information, so you can be confident about the fit before you order.",
    category: "Product Info",
    tags: ["sizing", "measurements", "fit"],
  },
  {
    id: 7,
    question: "Can I request a custom-made product?",
    answer: "At the moment, we don't offer custom orders.",
    category: "Product Info",
    tags: ["custom order"],
  },

  // Returns & Warranty
  {
    id: 8,
    question: "Is there a warranty on products?",
    answer:
      "We don't offer a standard warranty. However, if your product arrives with a manufacturing defect, we'll replace it for you.",
    category: "Returns & Warranty",
    tags: ["warranty", "defect"],
  },
  {
    id: 9,
    question: "Can I return or exchange a product?",
    answer:
      "If you change your mind, you can exchange your product for a different one of the same price or higher within 7 days of delivery. Please note we don't offer cash refunds. If the new product costs more, you'll just need to pay the difference.",
    category: "Returns & Warranty",
    tags: ["return", "exchange", "refund"],
  },
  {
    id: 10,
    question: "What if my product arrives damaged?",
    answer:
      "Please check your parcel at the time of delivery. If you notice any damage, let us know right away. Having a photo or video of the damage along with your order number will help us resolve it quickly.",
    category: "Returns & Warranty",
    tags: ["damaged product", "complaint"],
  },

  // Shopping & Offers
  {
    id: 11,
    question: "Can I see the product in person before buying?",
    answer:
      "We currently don't have a physical store, so all our products are available to browse and purchase online. We've made sure our product photos and details are as clear as possible to help you choose confidently.",
    category: "Shopping & Offers",
    tags: ["physical store", "showroom"],
  },
  {
    id: 12,
    question: "Do you have any ongoing offers or discounts?",
    answer:
      "Yes! We regularly run seasonal offers, bundle discounts, first-order deals, and special festival campaigns. Keep an eye on our website and social page so you don't miss out.",
    category: "Shopping & Offers",
    tags: ["offers", "discounts", "promotions"],
  },
  {
    id: 13,
    question: "Do you take corporate or bulk orders?",
    answer:
      "At this time, we're not accepting bulk orders for offices, hotels, restaurants, or large projects.",
    category: "Shopping & Offers",
    tags: ["bulk order", "corporate order"],
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  "Delivery & Tracking": <Truck className="w-6 h-6" />,
  Payment: <CreditCard className="w-6 h-6" />,
  "Product Info": <Ruler className="w-6 h-6" />,
  "Returns & Warranty": <Shield className="w-6 h-6" />,
  "Shopping & Offers": <ShoppingBag className="w-6 h-6" />,
};

const FAQPageComp = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [activeCategory, setActiveCategory] = useState<string | "All">("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    "All",
    ...Array.from(new Set(faqData?.map((item) => item.category))),
  ];

  const filteredFAQs = faqData.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchInputRef.current?.blur();
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex)?.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-100 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    categories.forEach((cat) => {
      if (cat === "All") {
        stats[cat] = faqData.length;
      } else {
        stats[cat] = faqData.filter((item) => item.category === cat).length;
      }
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Ondorkotha — Everything you need to know before you order.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search questions or keywords..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-300">
                {searchQuery
                  ? `Found ${filteredFAQs.length} result${
                      filteredFAQs.length !== 1 ? "s" : ""
                    }`
                  : "Type to search our FAQ database"}
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar (Expandable on Mobile) */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden lg:sticky lg:top-24">
              {/* Mobile Header / Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-full flex lg:hidden items-center justify-between p-4 bg-white text-gray-900 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  <span>Category: {activeCategory}</span>
                </div>
                {isSidebarOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {/* Desktop Header */}
              <div className="hidden lg:block p-6 pb-2">
                <h3 className="font-bold text-gray-900">Categories</h3>
              </div>

              {/* Categories List */}
              <div
                className={`${
                  isSidebarOpen ? "block" : "hidden"
                } lg:block p-2 lg:p-4 space-y-1`}
              >
                {categories?.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setIsSidebarOpen(false); // Close on selection (mobile)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeCategory === category
                        ? "bg-black text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        activeCategory === category
                          ? "bg-white/20"
                          : "bg-gray-100"
                      }`}
                    >
                      {categoryStats[category]}
                    </span>
                  </button>
                ))}
                <div className="mt-6 pt-6 border-t lg:hidden grid grid-cols-1 gap-2">
                   <a href="/help/contact-us" className="text-center py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Email Us</a>
                </div>
              </div>
           
              {/* Help Card */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Still need help?
                </h4>
                <p className="text-blue-700 text-sm mb-4">
                  Can't find what you're looking for? Contact our support team.
                </p>
                <div className="space-y-3">
                  <a
                    href="/help/contact-us"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeCategory === "All" ? "All Questions" : activeCategory}
                </h2>
                <p className="text-gray-600">
                  {filteredFAQs.length} question
                  {filteredFAQs.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {searchQuery || activeCategory !== "All" ? (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFAQs.length > 0 ? (
                filteredFAQs?.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
                  >
                    <button
                      onClick={() => toggleFAQ(item.id)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg mt-1">
                          {categoryIcons[item.category]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {highlightText(item.question)}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {item.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {expandedId === item.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedId === item.id && (
                      <div className="px-6 pb-5 pt-2 border-t">
                        <div className="pl-12">
                          <p className="text-gray-700 leading-relaxed">
                            {highlightText(item.answer)}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              Category: {item.category}
                            </span>
                            <button
                              onClick={() => toggleFAQ(item.id)}
                              className="text-sm text-gray-600 hover:text-gray-900"
                            >
                              Collapse
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      No results found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      We couldn't find any FAQs matching "{searchQuery}". Try
                      different keywords or browse by category.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
                    >
                      View All FAQs
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Popular Questions */}
            {!searchQuery && activeCategory === "All" && (
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Popular Questions
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {faqData.slice(0, 4)?.map((item) => (
                    <a
                      key={item.id}
                      href={`#faq-${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFAQ(item.id);
                        document
                          .getElementById(`faq-${item.id}`)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {categoryIcons[item.category]}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {item.question}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.answer.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Banner */}
            <div className="mt-16 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Still have questions?
                </h3>
                <p className="text-gray-300 mb-8 text-lg">
                  Our customer support team is here to help you with any
                  questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/help/contact-us"
                    className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition"
                  >
                    Contact Us
                  </a>
                  <a
                    href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                    className="px-8 py-3 bg-transparent text-white border border-white/30 font-medium rounded-lg hover:bg-white/10 transition"
                  >
                    Call Now: {process.env.NEXT_PUBLIC_PHONE_LABEL}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPageComp;
