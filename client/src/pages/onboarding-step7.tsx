import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ChatWidget } from "../components/ChatWidget";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Users } from "lucide-react";

interface OrgChartMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  managerId?: string;
}

interface CompanyConfig {
  orgChart?: OrgChartMember[];
}

const defaultTeammates: OrgChartMember[] = [
  { id: "1", name: "Alex Chen", role: "Senior PM", email: "alex.chen@company.com", department: "Product" },
  { id: "2", name: "Priya N.", role: "Engineering Lead", email: "priya.n@company.com", department: "Engineering" },
  { id: "3", name: "Sam R.", role: "Design Lead", email: "sam.r@company.com", department: "Design" },
];

export default function OnboardingStep7() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);

  const { data: companyConfig, isLoading } = useQuery<CompanyConfig>({
    queryKey: ['/api/company-config'],
  });

  const teammates = companyConfig?.orgChart?.filter(m => m.name.trim())?.length 
    ? companyConfig.orgChart.filter(m => m.name.trim())
    : defaultTeammates;

  useEffect(() => {
    if (user?.email) {
      updateProgress({ onboardingStep: 7 });
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

  const handleContinue = () => {
    if (user?.email) {
      updateProgress({ onboardingStep: 8, onboardingData: { teamIntroViewed: true } });
    }
    setLocation('/onboarding-step8');
  };

  const buildHierarchy = (members: OrgChartMember[]) => {
    const topLevel = members.filter(m => !m.managerId);
    const getReports = (managerId: string): OrgChartMember[] => 
      members.filter(m => m.managerId === managerId);
    
    return { topLevel, getReports };
  };

  const { topLevel, getReports } = buildHierarchy(teammates);

  const renderOrgNode = (member: OrgChartMember, level: number = 0) => {
    const reports = getReports(member.id);
    return (
      <div key={member.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
              {member.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>
          </div>
        </div>
        {reports.map(r => renderOrgNode(r, level + 1))}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>

      <div className="w-full max-w-4xl">
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-4">
            Team Introductions
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Meet your closest collaborators
          </p>
        </div>

        <div
          className={`space-y-6 mb-8 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teammates.slice(0, 6).map((t) => (
                  <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{t.name}</h3>
                          <p className="text-sm text-gray-600">{t.role}</p>
                          {t.department && (
                            <p className="text-xs text-gray-500">{t.department}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded-xl">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a 
                        href={`mailto:${t.email}`}
                        className="text-sm text-blue-600 hover:underline truncate"
                        data-testid={`link-email-${t.id}`}
                      >
                        {t.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Organization Chart
                  </h3>
                  <button
                    onClick={() => setShowOrgChart(!showOrgChart)}
                    className="text-sm text-blue-600 hover:underline"
                    data-testid="button-toggle-orgchart"
                  >
                    {showOrgChart ? 'Hide' : 'Show'} Chart
                  </button>
                </div>
                
                {showOrgChart ? (
                  <div className="border-t border-gray-100 pt-4">
                    {topLevel.length > 0 ? (
                      topLevel.map(member => renderOrgNode(member))
                    ) : (
                      teammates.map(member => (
                        <div key={member.id} className="py-2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Click "Show Chart" to explore how your team connects across the company.
                  </p>
                )}
              </div>
            </>
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
            data-testid="button-continue-step7"
            aria-label="Continue to role-specific training"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

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
          page="onboarding step 7 — meeting the team and org chart"
        />
      )}
    </div>
  );
}
