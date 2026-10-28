import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";

/**
 * Admin onboarding step 4: Integrations configuration
 *
 * Administrators select and configure integrations such as SSO, team chat
 * and HRIS systems.  For demonstration purposes these inputs simply
 * capture the selection and API tokens (if any) but do not perform
 * real OAuth flows.  Detailed setup can be finalised in the admin panel.
 */
export default function AdminOnboardingStep4() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [ssoProvider, setSsoProvider] = useState("google");
  const [chatProvider, setChatProvider] = useState("slack");
  const [hrisProvider, setHrisProvider] = useState("");
  const [apiKeys, setApiKeys] = useState({ sso: "", chat: "", hris: "" });

  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 4 });
    }
  }, [user?.email]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowTitle(true), 300),
      setTimeout(() => setShowContent(true), 800),
      setTimeout(() => setShowButton(true), 1500),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const handleNext = () => {
    if (user?.email) {
      updateProgress({
        adminOnboardingStep: 4,
        adminOnboardingData: { ssoProvider, chatProvider, hrisProvider, apiKeys },
      });
    }
    setLocation("/admin-onboarding-step5");
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
        <div
          className={`text-center mb-10 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-3">
            Configure Integrations
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Connect your identity, communication and HR systems
          </p>
        </div>
        <div
          className={`space-y-6 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* SSO Provider */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Single Sign‑On provider
            </h2>
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6">
              {[
                { value: "google", label: "Google Workspace" },
                { value: "okta", label: "Okta" },
                { value: "azure", label: "Azure AD" },
                { value: "none", label: "None" },
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center space-x-2">
                  <input
                    type="radio"
                    name="sso"
                    value={opt.value}
                    checked={ssoProvider === opt.value}
                    onChange={() => setSsoProvider(opt.value)}
                    className="form-radio h-5 w-5 text-black"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {ssoProvider !== "none" && (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  SSO API key / token
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={apiKeys.sso}
                  onChange={(e) => setApiKeys((k) => ({ ...k, sso: e.target.value }))}
                  placeholder="Paste your SSO API token"
                />
              </div>
            )}
          </div>
          {/* Chat provider */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Team chat
            </h2>
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6">
              {[
                { value: "slack", label: "Slack" },
                { value: "teams", label: "Microsoft Teams" },
                { value: "none", label: "None" },
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center space-x-2">
                  <input
                    type="radio"
                    name="chat"
                    value={opt.value}
                    checked={chatProvider === opt.value}
                    onChange={() => setChatProvider(opt.value)}
                    className="form-radio h-5 w-5 text-black"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {chatProvider !== "none" && (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Chat API key / token
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={apiKeys.chat}
                  onChange={(e) => setApiKeys((k) => ({ ...k, chat: e.target.value }))}
                  placeholder="Paste your Slack or Teams token"
                />
              </div>
            )}
          </div>
          {/* HRIS provider */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">HRIS</h2>
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6">
              {[
                { value: "workday", label: "Workday" },
                { value: "bamboo", label: "BambooHR" },
                { value: "none", label: "None" },
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hris"
                    value={opt.value}
                    checked={hrisProvider === opt.value}
                    onChange={() => setHrisProvider(opt.value)}
                    className="form-radio h-5 w-5 text-black"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {hrisProvider !== "none" && (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  HRIS API key / token
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={apiKeys.hris}
                  onChange={(e) => setApiKeys((k) => ({ ...k, hris: e.target.value }))}
                  placeholder="Paste your HRIS token"
                />
              </div>
            )}
          </div>
        </div>
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