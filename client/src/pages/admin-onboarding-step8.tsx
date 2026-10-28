import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BenefitItem {
  id: string;
  title: string;
  content: string;
}

interface ComplianceModule {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

export default function AdminOnboardingStep8() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [benefits, setBenefits] = useState<BenefitItem[]>([
    { id: "1", title: "Medical Insurance", content: "" },
    { id: "2", title: "Dental & Vision", content: "" },
    { id: "3", title: "401(k) Retirement Plan", content: "" },
    { id: "4", title: "PTO Policy", content: "" },
  ]);

  const [compliance, setCompliance] = useState<ComplianceModule[]>([
    { id: "1", title: "Anti-harassment Training", content: "", required: true },
    { id: "2", title: "Data Protection & Privacy", content: "", required: true },
    { id: "3", title: "Workplace Safety", content: "", required: true },
  ]);

  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 8 });
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

  const handleBenefitChange = (id: string, field: "title" | "content", value: string) => {
    setBenefits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddBenefit = () => {
    setBenefits((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", content: "" },
    ]);
  };

  const handleRemoveBenefit = (id: string) => {
    setBenefits((prev) => prev.filter((item) => item.id !== id));
  };

  const handleComplianceChange = (
    id: string,
    field: "title" | "content" | "required",
    value: string | boolean
  ) => {
    setCompliance((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddCompliance = () => {
    setCompliance((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", content: "", required: false },
    ]);
  };

  const handleRemoveCompliance = (id: string) => {
    setCompliance((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/company-config", {
        benefitsContent: benefits,
        complianceContent: compliance,
      });

      if (user?.email) {
        updateProgress({
          adminOnboardingStep: 8,
          adminOnboardingData: { benefitsContent: benefits, complianceContent: compliance },
        });
      }
      setLocation("/admin-onboarding-step9");
    } catch (error) {
      console.error("Failed to save HR content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>
      <div className="w-full max-w-4xl">
        <div
          className={`text-center mb-10 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-3">
            HR & Benefits Content
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Configure the benefits and compliance content employees will see during onboarding
          </p>
        </div>

        <div
          className={`space-y-8 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Benefits & Perks</h2>
              <button
                onClick={handleAddBenefit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all duration-200 font-medium text-sm"
                data-testid="button-add-benefit"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add detailed information about each benefit that new employees should know about.
            </p>
            <div className="space-y-4">
              {benefits.map((item, idx) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 space-y-3"
                  data-testid={`benefit-item-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      value={item.title}
                      onChange={(e) => handleBenefitChange(item.id, "title", e.target.value)}
                      placeholder="Benefit title (e.g., Medical Insurance)"
                      data-testid={`input-benefit-title-${idx}`}
                    />
                    <button
                      onClick={() => handleRemoveBenefit(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-remove-benefit-${idx}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    rows={3}
                    value={item.content}
                    onChange={(e) => handleBenefitChange(item.id, "content", e.target.value)}
                    placeholder="Describe this benefit in detail. Include coverage amounts, eligibility, and how to enroll..."
                    data-testid={`textarea-benefit-content-${idx}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Compliance Modules</h2>
              <button
                onClick={handleAddCompliance}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all duration-200 font-medium text-sm"
                data-testid="button-add-compliance"
              >
                <Plus className="w-4 h-4" />
                Add Module
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Configure compliance training modules that employees must complete.
            </p>
            <div className="space-y-4">
              {compliance.map((item, idx) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 space-y-3"
                  data-testid={`compliance-item-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      value={item.title}
                      onChange={(e) => handleComplianceChange(item.id, "title", e.target.value)}
                      placeholder="Module title (e.g., Anti-harassment Training)"
                      data-testid={`input-compliance-title-${idx}`}
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-black border-gray-300 rounded"
                        checked={item.required}
                        onChange={(e) =>
                          handleComplianceChange(item.id, "required", e.target.checked)
                        }
                        data-testid={`checkbox-compliance-required-${idx}`}
                      />
                      Required
                    </label>
                    <button
                      onClick={() => handleRemoveCompliance(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-remove-compliance-${idx}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    rows={3}
                    value={item.content}
                    onChange={(e) => handleComplianceChange(item.id, "content", e.target.value)}
                    placeholder="Provide detailed training content for this module..."
                    data-testid={`textarea-compliance-content-${idx}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`text-center mt-10 transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-next"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
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
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
