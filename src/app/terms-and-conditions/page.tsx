import { Metadata } from "next";
import { TermsCondition } from "@/types/terms-condition";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getTerms(): Promise<TermsCondition[]> {
  try {
    const res = await fetch(`${API_URL}/terms-and-conditions`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: "Terms & Conditions | Ondorkotha",
};

export default async function TermsAndConditionsPage() {
  const terms = (await getTerms()).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-16 text-[#222222]">
      <h1 className="text-3xl font-light mb-10">Terms &amp; Conditions</h1>

      {terms.length === 0 ? (
        <p className="text-sm text-gray-500">No terms available right now.</p>
      ) : (
        <div className="space-y-10">
          {terms.map((term, idx) => (
            <section key={term.id}>
              <h2 className="text-lg font-medium mb-3">
                {idx + 1}. {term.title}
              </h2>
              <div
                className="prose-static"
                dangerouslySetInnerHTML={{ __html: term.content }}
              />
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
