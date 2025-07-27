export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-20">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Authentication Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your Google Calendar authentication has been completed successfully.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Ready to use
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your MCP server is now ready to use Google Calendar features.
                  You can create and manage medical appointments through the MCP
                  tools.
                </p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
