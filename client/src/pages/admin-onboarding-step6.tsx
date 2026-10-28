import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";

/**
 * Admin onboarding step 6: Compliance & training modules
 *
 * Administrators decide which compliance trainings are mandatory for
 * employees.  Predefined modules such as anti‑harassment and data
 * protection can be toggled on or off, and a field allows the admin to
 * specify additional custom training requirements.
 */
export default function AdminOnboardingStep6() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [trainings, setTrainings] = useState({
    antiHarassment: true,
    dataProtection: true,
    workplaceSafety: true,
  });
  const [customTraining, setCustomTraining] = useState("");

  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 6 });
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

  const toggleTraining = (key: keyof typeof trainings) => {
    setTrainings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => {
    if (user?.email) {
      updateProgress({
        adminOnboardingStep: 6,
        adminOnboardingData: { trainings, customTraining },
      });
    }
    setLocation("/admin-onboarding-step7");
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
            Compliance & Training
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Select the mandatory trainings for your employees
          </p>
        </div>
        <div
          className={`space-y-6 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Standard training modules
            </h2>
            <div className="flex flex-col space-y-3">
              {Object.keys(trainings).map((key) => (
                <label key={key} className="inline-flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-black border-gray-300"
                    checked={trainings[key as keyof typeof trainings]}
                    onChange={() => toggleTraining(key as keyof typeof trainings)}
                  />
                  <span className="text-gray-700 capitalize">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              We strongly recommend keeping these trainings enabled to
              promote a safe and inclusive workplace.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Additional requirements
            </h2>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={3}
              value={customTraining}
              onChange={(e) => setCustomTraining(e.target.value)}
              placeholder="Specify any additional training (e.g., HIPAA, PCI compliance)"
            ></textarea>
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