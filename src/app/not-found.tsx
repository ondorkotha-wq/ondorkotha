import Link from "next/link";

export default function NotFound() {
//   const handlePreviousPage = () => {
//     window.history.back();
//   };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="text-9xl font-bold text-gray-200">404</div>
          <h1 className="text-4xl font-bold text-gray-900 heading">Page Not Found</h1>
          <p className="text-gray-600 max-w-lg">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            might have been moved or doesn&apos;t exist.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return Home
          </Link>
          {/* <div className="text-sm text-gray-500">
            <p>or</p>
            <button
              onClick={handlePreviousPage}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Go back to previous page
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
