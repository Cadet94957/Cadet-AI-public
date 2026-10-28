import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ChatWidget } from "../components/ChatWidget";
import { useLocation } from "wouter";

type AppStatus = "not_checked" | "in_progress" | "ok" | "failed";

interface App {
  key: string;
  name: string;
  description: string;
  status: AppStatus;
  hasOAuth?: boolean;
  oauthType?: 'email' | 'chat';
}

const appsSeed: App[] = [
  { 
    key: "email", 
    name: "Email", 
    description: "Connect your email account to get started.", 
    status: "not_checked", 
    hasOAuth: true,
    oauthType: 'email'
  },
  { 
    key: "chat", 
    name: "Slack / Teams", 
    description: "Connect to your team communication platform.", 
    status: "not_checked", 
    hasOAuth: true,
    oauthType: 'chat'
  },
  { 
    key: "vpn", 
    name: "VPN", 
    description: "Connect and confirm secure tunnel established.", 
    status: "not_checked" 
  },
  { 
    key: "tools", 
    name: "Role-Specific Tools", 
    description: "Access your primary work tools and verify login.", 
    status: "not_checked" 
  },
];

const statusPill: Record<AppStatus, { label: string; aria: string }> = {
  not_checked: { label: "Not Connected", aria: "Status not connected" },
  in_progress: { label: "In Progress", aria: "Status in progress" },
  ok: { label: "Connected", aria: "Status connected" },
  failed: { label: "Failed", aria: "Status failed" },
};

const statusBadgeClass: Record<AppStatus, string> = {
  not_checked: "bg-gray-200 text-gray-700",
  in_progress: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  ok: "bg-green-100 text-green-800 ring-1 ring-green-300",
  failed: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",
};

export default function OnboardingStep5() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [apps, setApps] = useState<App[]>(appsSeed);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const pendingConnectionRef = useRef<'email' | 'chat' | null>(null);

  useEffect(() => {
    if (user?.email) {
      updateProgress({ onboardingStep: 5 });
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

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
        // Microsoft OAuth is used for both email (Outlook) and chat (Teams)
        if (pendingConnectionRef.current === 'chat') {
          updateAppStatus("chat", "ok");
        } else {
          updateAppStatus("email", "ok");
        }
        pendingConnectionRef.current = null;
      } else if (event.data.type === 'SLACK_AUTH_SUCCESS') {
        updateAppStatus("chat", "ok");
        pendingConnectionRef.current = null;
      } else if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        updateAppStatus("email", "ok");
        pendingConnectionRef.current = null;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateAppStatus = (key: string, status: AppStatus) => {
    setApps((prev) => prev.map((a) => (a.key === key ? { ...a, status } : a)));
  };

  const handleConnectGmail = () => {
    updateAppStatus("email", "in_progress");
    pendingConnectionRef.current = 'email';
    window.open(
      '/api/integrations/google/authorize',
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const handleConnectOutlook = () => {
    updateAppStatus("email", "in_progress");
    pendingConnectionRef.current = 'email';
    window.open(
      '/api/integrations/microsoft/authorize',
      'microsoft-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const handleConnectSlack = () => {
    updateAppStatus("chat", "in_progress");
    pendingConnectionRef.current = 'chat';
    window.open(
      '/api/auth/slack',
      'slack-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const handleConnectTeams = () => {
    updateAppStatus("chat", "in_progress");
    pendingConnectionRef.current = 'chat';
    window.open(
      '/api/auth/microsoft',
      'teams-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const checkAndShowModal = () => {
    const hasIssues = apps.some(app => app.status === 'in_progress' || app.status === 'failed');
    const allAttempted = apps.every(app => app.status !== 'not_checked');
    
    if (!allAttempted) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000); // Hide error after 3 seconds
      return;
    }
    
    if (hasIssues) {
      setShowModal(true);
    } else {
      handleFinalContinue();
    }
  };

  const handleFinalContinue = () => {
    if (user?.email) {
      updateProgress({ 
        onboardingStep: 6, 
        onboardingData: { 
          appVerificationStatus: apps,
          connectionFeedback: modalFeedback 
        } 
      });
    }
    setLocation('/onboarding-step6');
  };

  const issueApps = apps.filter(app => app.status === 'in_progress' || app.status === 'failed');

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>

      <div className={`w-full max-w-5xl transition-all duration-500 ${showModal ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100 blur-none'}`}>
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-4">
            Morning Welcome & Setup
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Let's verify your key applications. Connect to get started!
          </p>
        </div>

        <div
          className={`transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {apps.map((app) => (
              <div key={app.key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{app.name}</h3>
                    <p className="text-sm text-gray-600">{app.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass[app.status]}`}
                    role="status"
                    aria-label={statusPill[app.status].aria}
                    title={statusPill[app.status].label}
                  >
                    {statusPill[app.status].label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {app.hasOAuth && app.oauthType === 'email' && app.status === 'not_checked' && (
                    <>
                      <button
                        className="rounded-xl border border-blue-500 bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        onClick={handleConnectGmail}
                        data-testid={`button-connect-gmail-${app.key}`}
                      >
                        Connect Gmail
                      </button>
                      <button
                        className="rounded-xl border border-blue-500 bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        onClick={handleConnectOutlook}
                        data-testid={`button-connect-outlook-${app.key}`}
                      >
                        Connect Outlook
                      </button>
                    </>
                  )}
                  
                  {app.hasOAuth && app.oauthType === 'email' && app.status === 'in_progress' && (
                    <button
                      className="rounded-xl border border-amber-500 bg-amber-500 px-3 py-1.5 text-sm font-medium text-white cursor-default"
                      disabled
                      data-testid={`button-in-progress-${app.key}`}
                    >
                      In Progress
                    </button>
                  )}
                  
                  {app.hasOAuth && app.oauthType === 'chat' && app.status === 'not_checked' && (
                    <>
                      <button
                        className="rounded-xl border border-purple-500 bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        onClick={handleConnectSlack}
                        data-testid={`button-connect-slack-${app.key}`}
                      >
                        Connect Slack
                      </button>
                      <button
                        className="rounded-xl border border-blue-500 bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        onClick={handleConnectTeams}
                        data-testid={`button-connect-teams-${app.key}`}
                      >
                        Connect Teams
                      </button>
                    </>
                  )}
                  
                  {app.hasOAuth && app.oauthType === 'chat' && app.status === 'in_progress' && (
                    <button
                      className="rounded-xl border border-amber-500 bg-amber-500 px-3 py-1.5 text-sm font-medium text-white cursor-default"
                      disabled
                      data-testid={`button-in-progress-${app.key}`}
                    >
                      In Progress
                    </button>
                  )}
                  
                  {!app.hasOAuth && app.status === 'not_checked' && (
                    <button
                      className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                      onClick={() => updateAppStatus(app.key, "in_progress")}
                      data-testid={`button-connect-${app.key}`}
                    >
                      Get Connected
                    </button>
                  )}
                  
                  {!app.hasOAuth && app.status === 'in_progress' && (
                    <button
                      className="rounded-xl border border-amber-500 bg-amber-500 px-3 py-1.5 text-sm font-medium text-white cursor-default"
                      disabled
                      data-testid={`button-in-progress-${app.key}`}
                    >
                      In Progress
                    </button>
                  )}
                  
                  {app.status === 'failed' ? (
                    <button
                      className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      onClick={() => updateAppStatus(app.key, "not_checked")}
                      data-testid={`button-retry-${app.key}`}
                    >
                      Try Again
                    </button>
                  ) : (
                    <button
                      className="rounded-xl border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-600"
                      onClick={() => updateAppStatus(app.key, "failed")}
                      data-testid={`button-failed-${app.key}`}
                    >
                      Unable to Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`text-center transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={checkAndShowModal}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
            data-testid="button-continue-step5"
            aria-label="Continue to orientation"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {showError && (
            <p 
              className="mt-4 text-red-600 text-sm font-medium transition-all duration-300"
              data-testid="error-message-not-connected"
            >
              You have not attempted to connect to all of your apps yet. Please click connect for each one to continue.
            </p>
          )}
        </div>
      </div>

      {/* Follow-up Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-light text-gray-800 mb-6">Connection Feedback</h2>
            
            <div className="space-y-6 mb-8">
              {issueApps.map((app) => (
                <div key={app.key} className="space-y-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-800 mb-2 block">
                      {app.status === 'in_progress' 
                        ? `Why were you only able to be partially connected to ${app.name}?`
                        : `Why were you unable to connect to ${app.name}?`
                      }
                    </span>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                      rows={3}
                      value={modalFeedback[app.key] || ''}
                      onChange={(e) => setModalFeedback(prev => ({ ...prev, [app.key]: e.target.value }))}
                      placeholder="Please describe the issue..."
                      data-testid={`textarea-feedback-${app.key}`}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleFinalContinue}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
                data-testid="button-modal-continue"
                aria-label="Continue to orientation"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
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

      {/* Chat Widget */}
      {isChatOpen && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          isOnboarding={true}
          page="onboarding step 5 — connecting work apps (email, Slack/Teams, VPN, tools)"
        />
      )}
    </div>
  );
}
