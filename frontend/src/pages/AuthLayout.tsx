import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  toggle: { label: string; linkText: string; to: string };
}

export default function AuthLayout({ children, toggle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <p className="text-2xl font-bold text-gray-900 mb-6">Orbit</p>
        {children}
        <p className="mt-6 text-center text-sm text-gray-500">
          {toggle.label}{" "}
          <Link to={toggle.to} className="text-blue-600 font-medium hover:underline">
            {toggle.linkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
