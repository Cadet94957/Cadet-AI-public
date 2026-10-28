import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";

/**
 * Admin onboarding step 1: Company profile & primary admin
 *
 * This page collects the basic company information and the primary admin's
 * credentials.  It follows the same minimalistic styling used in the
 * employee onboarding pages: a light background, a centered card and
 * staggered fade‑in animations for the title, form and continue button.
 */
export default function AdminOnboardingStep1() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Company details collected from the admin
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    address: "",
    industry: "",
    size: "",
    domain: "",
    timezone: "",
  });
  // Primary admin details
  const [primaryAdmin, setPrimaryAdmin] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Mark step progress on mount when a user is authenticated
  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 1 });
    }
  }, [user?.email]);

  // Stagger animations for title, form and button
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowTitle(true), 300),
      setTimeout(() => setShowContent(true), 800),
      setTimeout(() => setShowButton(true), 1500),
    ];
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  // Handle navigation to the next step and save collected data
  const handleNext = () => {
    if (user?.email) {
      updateProgress({
        adminOnboardingStep: 1,
        adminOnboardingData: { companyInfo, primaryAdmin },
      });
    }
    setLocation("/admin-onboarding-step2");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>
      <div className="w-full max-w-3xl">
        {/* Page title */}
        <div
          className={`text-center mb-10 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-3">
            Company Profile
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Tell us a bit about your organisation and primary administrator
          </p>
        </div>
        {/* Form content */}
        <div
          className={`space-y-6 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Company info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Company information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Company name
                </span>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={companyInfo.name}
                  onChange={(e) =>
                    setCompanyInfo((info) => ({ ...info, name: e.target.value }))
                  }
                  placeholder="Acme Corp"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Industry
                </span>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={companyInfo.industry}
                  onChange={(e) =>
                    setCompanyInfo((info) => ({ ...info, industry: e.target.value }))
                  }
                  placeholder="Technology, Healthcare, etc."
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Number of employees
                </span>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={companyInfo.size}
                  onChange={(e) =>
                    setCompanyInfo((info) => ({ ...info, size: e.target.value }))
                  }
                  placeholder="50"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Headquarters address
                </span>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={companyInfo.address}
                  onChange={(e) =>
                    setCompanyInfo((info) => ({ ...info, address: e.target.value }))
                  }
                  placeholder="123 Main St, Anytown"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Corporate domain
                </span>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={companyInfo.domain}
                  onChange={(e) =>
                    setCompanyInfo((info) => ({ ...info, domain: e.target.value }))
                  }
                  placeholder="example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Time zone
                </span>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={companyInfo.timezone}
                  onChange={(e) =>
                    setCompanyInfo((info) => ({ ...info, timezone: e.target.value }))
                  }
                  placeholder="America/Los_Angeles"
                />
              </label>
            </div>
          </div>
          {/* Primary admin info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Primary administrator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Full name
                </span>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={primaryAdmin.fullName}
                  onChange={(e) =>
                    setPrimaryAdmin((info) => ({ ...info, fullName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Work email
                </span>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={primaryAdmin.email}
                  onChange={(e) =>
                    setPrimaryAdmin((info) => ({ ...info, email: e.target.value }))
                  }
                  placeholder="admin@example.com"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-gray-800 mb-1 block">
                  Password
                </span>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={primaryAdmin.password}
                  onChange={(e) =>
                    setPrimaryAdmin((info) => ({ ...info, password: e.target.value }))
                  }
                  placeholder="Create a secure password"
                />
              </label>
            </div>
          </div>
        </div>
        {/* Continue button */}
        <div
          className={`text-center mt-10 transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105 font-medium"
          >
            Next
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}