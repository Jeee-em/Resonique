import type { Route } from "./+types/404";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "404 - Page Not Found" },
        { name: "description", content: "The page you're looking for doesn't exist." },
    ];
}

export default function NotFound() {
    // For DevTools requests and other automated requests, just return null
    if (typeof window !== 'undefined' && window.location.pathname.includes('.well-known')) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Go back home
                </a>
            </div>
        </div>
    );
}