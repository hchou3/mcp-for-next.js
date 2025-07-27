import { Suspense } from "react";

function ErrorContent({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;

  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "access_denied":
        return "Access was denied. Please try again and make sure to authorize the application.";
      case "no_code":
        return "No authorization code was received from Google.";
      case "auth_failed":
        return "Authentication failed. Please try again.";
      case "callback_error":
        return "An error occurred during the authentication process.";
      default:
        return "An unexpected error occurred during authentication.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">{getErrorMessage(error)}</p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  What to do next
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check your internet connection</li>
                    <li>Make sure you authorized the application in Google</li>
                    <li>Try the authentication process again</li>
                    <li>Contact support if the problem persists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center space-x-4">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Home
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent searchParams={searchParams} />
    </Suspense>
  );
}
