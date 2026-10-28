import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";

/**
 * Admin onboarding step 5: Employee import & assignment
 *
 * This page lets administrators choose how to populate Cadet with their
 * workforce.  They can import from the connected HRIS, upload a CSV file,
 * or add employees manually after onboarding.  A simple mentor assignment
 * toggle allows the admin to enable buddy matching for new hires.
 */
export default function AdminOnboardingStep5() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [importMethod, setImportMethod] = useState<string>("hris");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [enableBuddy, setEnableBuddy] = useState(true);

  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 5 });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
  };

  const handleNext = () => {
    if (user?.email) {
      updateProgress({
        adminOnboardingStep: 5,
        adminOnboardingData: {
          importMethod,
          csvFileName: csvFile?.name || null,
          enableBuddy,
        },
      });
    }
    setLocation("/admin-onboarding-step6");
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
            Employee Import
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Bring your team into Cadet and assign mentors
          </p>
        </div>
        <div
          className={`space-y-6 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Import method</h2>
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6">
              {[
                { value: "hris", label: "Use connected HRIS" },
                { value: "csv", label: "Upload CSV" },
                { value: "manual", label: "Add manually later" },
              ].map((opt) => (
                <label key={opt.value} className="inline-flex items-center space-x-2">
                  <input
                    type="radio"
                    name="import"
                    value={opt.value}
                    checked={importMethod === opt.value}
                    onChange={() => setImportMethod(opt.value)}
                    className="form-radio h-5 w-5 text-black"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {importMethod === "csv" && (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Upload CSV file
                </label>
                <input type="file" accept=".csv" onChange={handleFileChange} />
                {csvFile && (
                  <p className="text-sm text-gray-600">Selected file: {csvFile.name}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  CSV should include columns for name, email, start date,
                  department and manager.
                </p>
              </div>
            )}
            {importMethod === "manual" && (
              <p className="text-sm text-gray-500 mt-2">
                You can add employees individually from the admin dashboard after
                completing onboarding.
              </p>
            )}
          </div>
          {/* Buddy / mentor assignment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Mentor matching</h2>
            <label className="inline-flex items-center space-x-3">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-black border-gray-300"
                checked={enableBuddy}
                onChange={() => setEnableBuddy(!enableBuddy)}
              />
              <span className="text-gray-700">Enable buddy assignments for new hires</span>
            </label>
            <p className="text-sm text-gray-500">
              When enabled, new employees will be matched with a mentor or buddy
              from their department to help them acclimate.
            </p>
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