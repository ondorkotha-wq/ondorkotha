import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AdminForbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Access Forbidden</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        You don&apos;t have permission to access this page. If you think this
        is a mistake, contact a super admin.
      </p>
      <Link
        href="/admin/dashboard"
        className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
