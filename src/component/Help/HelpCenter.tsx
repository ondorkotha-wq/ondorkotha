"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Truck,
  RotateCcw,
  Ruler,
  ShoppingBag,
  LucideIcon,
} from "lucide-react";

// --- Types & Interfaces ---

interface Category {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface FAQData {
  [key: string]: FAQ[];
}

interface ContactOption {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  availability: string;
  action: string;
}

// --- Data ---

const categories: Category[] = [
  {
    id: "delivery",
    title: "Delivery & Tracking",
    icon: Truck,
    description: "Delivery time, cost, and order tracking",
  },
  {
    id: "payment",
    title: "Payment",
    icon: CreditCard,
    description: "Cash on Delivery and payment options",
  },
  {
    id: "product",
    title: "Product Info",
    icon: Ruler,
    description: "Sizing, fit, and custom orders",
  },
  {
    id: "returns",
    title: "Returns & Warranty",
    icon: RotateCcw,
    description: "Exchanges, warranty, and damaged items",
  },
  {
    id: "shopping",
    title: "Shopping & Offers",
    icon: ShoppingBag,
    description: "Buying online, offers, and bulk orders",
  },
];

const faqData: FAQData = {
  delivery: [
    {
      question: "When will I receive my delivery?",
      answer:
        "Once your order is confirmed, delivery usually takes 3 to 10 working days. The exact time depends on the product and your location — deliveries within the city are typically faster, while remote areas may take a bit longer.",
    },
    {
      question: "How can I track my order?",
      answer:
        "You can track your order anytime from your account dashboard. You're also welcome to call our support hotline with your order number, and we'll update you on the status.",
    },
    {
      question: "How much does delivery cost?",
      answer:
        "Delivery charges depend on your location, along with the product's size, weight, and volume. Larger furniture pieces may have an additional charge, including a possible floor delivery fee. We'll always confirm the exact delivery cost with you before your order is finalized.",
    },
  ],
  payment: [
    {
      question: "Do you offer Cash on Delivery?",
      answer: "Yes, Cash on Delivery is available on our store.",
    },
    {
      question: "Can I pay in installments (EMI)?",
      answer: "We don't currently offer EMI or installment payment options.",
    },
  ],
  product: [
    {
      question: "How do I know if a product will fit my space?",
      answer:
        "Every product page includes detailed measurements — length, width, and height — along with material and color information, so you can be confident about the fit before you order.",
    },
    {
      question: "Can I request a custom-made product?",
      answer: "At the moment, we don't offer custom orders.",
    },
  ],
  returns: [
    {
      question: "Is there a warranty on products?",
      answer:
        "We don't offer a standard warranty. However, if your product arrives with a manufacturing defect, we'll replace it for you.",
    },
    {
      question: "Can I return or exchange a product?",
      answer:
        "If you change your mind, you can exchange your product for a different one of the same price or higher within 7 days of delivery. Please note we don't offer cash refunds. If the new product costs more, you'll just need to pay the difference.",
    },
    {
      question: "What if my product arrives damaged?",
      answer:
        "Please check your parcel at the time of delivery. If you notice any damage, let us know right away. Having a photo or video of the damage along with your order number will help us resolve it quickly.",
    },
  ],
  shopping: [
    {
      question: "Can I see the product in person before buying?",
      answer:
        "We currently don't have a physical store, so all our products are available to browse and purchase online. We've made sure our product photos and details are as clear as possible to help you choose confidently.",
    },
    {
      question: "Do you have any ongoing offers or discounts?",
      answer:
        "Yes! We regularly run seasonal offers, bundle discounts, first-order deals, and special festival campaigns. Keep an eye on our website and social page so you don't miss out.",
    },
    {
      question: "Do you take corporate or bulk orders?",
      answer:
        "At this time, we're not accepting bulk orders for offices, hotels, restaurants, or large projects.",
    },
  ],
};

const contactOptions: ContactOption[] = [
  {
    id: "chat",
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team",
    availability: "Available during business hours",
    action: "Start Chat",
  },
  {
    id: "email",
    icon: Mail,
    title: "Email Support",
    description: "Send us a message",
    availability: "Response within 24 hours",
    action: "Send Email",
  },
  {
    id: "phone",
    icon: Phone,
    title: "Phone Support",
    description: "Speak with a representative",
    availability: "Mon-Sat, 9 AM - 8 PM",
    action: process.env.NEXT_PUBLIC_PHONE_LABEL || "Call Support",
  },
];

// --- Sub-Components ---

const FAQItem: React.FC<{
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ faq, isOpen, onToggle }) => (
  <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
    >
      <span className="text-sm font-medium text-gray-900 pr-4">
        {faq.question}
      </span>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-5 pb-4 pt-0 border-t border-gray-50">
        <p className="text-xs text-gray-600 leading-relaxed pt-4">
          {faq.answer}
        </p>
      </div>
    )}
  </div>
);

// --- Main Component ---

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const allFaqs: FAQ[] = Object.values(faqData)
    .flat()
    .filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const filteredFaqs: FAQ[] = selectedCategory
    ? faqData[selectedCategory].filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header & Search */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <h1 className="text-2xl md:text-3xl font-medium mb-2 tracking-tight text-gray-900">
            Help Center
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Find answers to common questions and get support
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Search Results View */}
        {searchQuery && !selectedCategory && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-900 mb-4">
              Search Results ({allFaqs.length})
            </h2>
            {allFaqs.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-lg bg-white">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-900 font-medium">
                  No results found
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allFaqs?.map((faq, idx) => (
                  <FAQItem
                    key={idx}
                    faq={faq}
                    isOpen={expandedFaq === idx}
                    onToggle={() =>
                      setExpandedFaq(expandedFaq === idx ? null : idx)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Detail View */}
        {selectedCategory ? (
          <div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setExpandedFaq(null);
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Categories
            </button>

            {categories
              .filter((c) => c.id === selectedCategory)
              ?.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {cat.title}
                      </h2>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                );
              })}

            <div className="space-y-3">
              {filteredFaqs?.map((faq, idx) => (
                <FAQItem
                  key={idx}
                  faq={faq}
                  isOpen={expandedFaq === idx}
                  onToggle={() =>
                    setExpandedFaq(expandedFaq === idx ? null : idx)
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          /* Landing View (Categories & Contact) */
          <>
            {!searchQuery && (
              <>
                <section className="mb-12">
                  <h2 className="text-sm font-medium text-gray-900 mb-4">
                    Browse by Category
                  </h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {categories?.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setExpandedFaq(null);
                          }}
                          className="border border-gray-200 rounded-lg bg-white p-4 hover:border-gray-300 transition-colors text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                              <Icon className="w-5 h-5 text-gray-700" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 mb-1">
                                {category.title}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {category.description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="text-sm font-medium text-gray-900 mb-4">
                    Contact Support
                  </h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {contactOptions?.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div
                          key={option.id}
                          className="border border-gray-200 rounded-lg bg-white p-5"
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                            <Icon className="w-5 h-5 text-gray-700" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {option.title}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">
                            {option.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-4">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{option.availability}</span>
                          </div>
                          <button className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                            {option.action}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <button className="text-sm text-gray-900 font-medium hover:text-gray-700 transition-colors">
            Contact our support team →
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;
