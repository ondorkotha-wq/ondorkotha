import Link from "next/link";

export default function UnauthorizedComp() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6">
          <div className="text-9xl font-bold text-red-200">403</div>
        <h2 className="text-3xl font-semibold">Access Denied</h2>
        <p className="text-gray-600 max-w-md">
          You don’t have permission to access this page.
        </p>

        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
