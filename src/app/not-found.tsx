import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <FileQuestion className="h-10 w-10 text-gray-400" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">Page Not Found</h1>
      <p className="mt-2 text-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
