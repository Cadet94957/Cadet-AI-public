import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ChatWidget } from "../components/ChatWidget";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, X, Loader2 } from "lucide-react";

interface BenefitItem {
  id: string;
  title: string;
  content: string;
}

interface ComplianceItem {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

interface CompanyConfig {
  benefitsContent?: BenefitItem[];
  complianceContent?: ComplianceItem[];
}

const defaultBenefits: BenefitItem[] = [
  { id: "benefits", title: "Benefits Overview", content: "Review your healthcare, dental, and vision coverage options. Contact HR for enrollment assistance." },
  { id: "payroll", title: "Payroll Information", content: "Payroll is processed bi-weekly. Direct deposit is available. Access your pay stubs through the employee portal." },
  { id: "pto", title: "PTO & Holidays", content: "You receive 15 days of PTO annually plus company holidays. Check the employee handbook for the full holiday calendar." },
];

const defaultCompliance: ComplianceItem[] = [
  { id: "harassment", title: "Anti-harassment Training", content: "Our company maintains a zero-tolerance policy for harassment. This training covers identifying, preventing, and reporting harassment in the workplace.", required: true },
  { id: "dataProtection", title: "Data Protection Policy", content: "Learn about our data handling procedures, privacy requirements, and your responsibilities for protecting sensitive information.", required: true },
  { id: "safety", title: "Workplace Safety Guidelines", content: "Review emergency procedures, safety protocols, and reporting requirements for workplace incidents.", required: true },
];

export default function OnboardingStep6() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [readItems, setReadItems] = useState<Record<string, boolean>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [modalItem, setModalItem] = useState<{ type: 'benefit' | 'compliance'; item: BenefitItem | ComplianceItem } | null>(null);

  const { data: companyConfig, isLoading } = useQuery<CompanyConfig>({
    queryKey: ['/api/company-config'],
  });

  const benefits = companyConfig?.benefitsContent?.length ? companyConfig.benefitsContent : defaultBenefits;
  const compliance = companyConfig?.complianceContent?.length ? companyConfig.complianceContent : defaultCompliance;

  useEffect(() => {
    if (user?.email) {
      updateProgress({ onboardingStep: 6 });
    }
  }, [user?.email]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowTitle(true), 300),
      setTimeout(() => setShowContent(true), 800),
      setTimeout(() => setShowButton(true), 1500),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const handleItemClick = (type: 'benefit' | 'compliance', item: BenefitItem | ComplianceItem) => {
    setModalItem({ type, item });
  };

  const handleModalClose = () => {
    if (modalItem) {
      setReadItems(prev => ({ ...prev, [modalItem.item.id]: true }));
    }
    setModalItem(null);
  };

  const handleContinue = () => {
    if (user?.email) {
      updateProgress({ onboardingStep: 7, onboardingData: { hrChecklist: readItems } });
    }
    setLocation('/onboarding-step7');
  };

  const allBenefitsRead = benefits.every(b => readItems[b.id]);
  const allComplianceRead = compliance.every(c => readItems[c.id]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>

      <div className="w-full max-w-5xl">
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-4">
            HR & Compliance
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Click each item to review the details
          </p>
        </div>

        <div
          className={`transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Benefits & Payroll</h3>
                  {allBenefitsRead && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                <div className="space-y-2">
                  {benefits.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick('benefit', item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-gray-50 ${
                        readItems[item.id] ? 'bg-green-50 border border-green-200' : 'border border-gray-200'
                      }`}
                      data-testid={`button-benefit-${item.id}`}
                    >
                      {readItems[item.id] ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                      )}
                      <span className={`text-sm ${readItems[item.id] ? 'text-green-800' : 'text-gray-700'}`}>
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Compliance Modules</h3>
                  {allComplianceRead && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                <div className="space-y-2">
                  {compliance.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick('compliance', item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-gray-50 ${
                        readItems[item.id] ? 'bg-green-50 border border-green-200' : 'border border-gray-200'
                      }`}
                      data-testid={`button-compliance-${item.id}`}
                    >
                      {readItems[item.id] ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                      )}
                      <span className={`text-sm ${readItems[item.id] ? 'text-green-800' : 'text-gray-700'}`}>
                        {item.title}
                        {'required' in item && item.required && (
                          <span className="ml-2 text-xs text-red-500">*Required</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`text-center transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleContinue}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
            data-testid="button-continue-step6"
            aria-label="Continue to team introductions"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {modalItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">{modalItem.item.title}</h2>
              <button
                onClick={handleModalClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="button-modal-close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {modalItem.item.content || "No content available."}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleModalClose}
                className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                data-testid="button-modal-done"
              >
                I've Read This
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 right-8 z-20">
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-16 h-16 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl font-light shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
          data-testid="chat-icon-onboarding"
          aria-label="Open onboarding assistant"
        >
          C
        </button>
      </div>

      {isChatOpen && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          isOnboarding={true}
          page="onboarding step 6 — HR benefits and compliance training"
        />
      )}
    </div>
  );
}
