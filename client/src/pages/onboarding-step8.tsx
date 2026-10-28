import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ChatWidget } from "../components/ChatWidget";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, User, MessageSquare, Loader2 } from "lucide-react";

interface SandboxTask {
  title: string;
  description: string;
  instructions: string;
}

interface CompanyConfig {
  sandboxTask?: SandboxTask;
}

const defaultSandboxTask: SandboxTask = {
  title: "Complete Your Profile & Introduce Yourself",
  description: "This universal task helps you get set up in our company systems and introduce yourself to the team.",
  instructions: `1. **Update your employee profile**
   - Add a professional profile photo
   - Write a brief bio (2-3 sentences about your background)
   - Verify your contact information is correct

2. **Make your first internal post**
   - Open Slack/Teams (whichever your company uses)
   - Find the #introductions or #new-employees channel
   - Write a brief introduction including:
     • Your name and role
     • Where you're based
     • One fun fact about yourself
   - Don't be shy - the team is excited to meet you!

3. **Check the box below once complete**
   - Your profile is updated with a photo and bio
   - You've posted your introduction to the team`
};

export default function OnboardingStep8() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { data: companyConfig, isLoading } = useQuery<CompanyConfig>({
    queryKey: ['/api/company-config'],
  });

  const sandboxTask = companyConfig?.sandboxTask?.title 
    ? companyConfig.sandboxTask 
    : defaultSandboxTask;

  useEffect(() => {
    if (user?.email) {
      updateProgress({ onboardingStep: 8 });
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
      updateProgress({ 
        onboardingStep: 9, 
        onboardingData: { 
          sandboxTaskCompleted: profileComplete && introComplete,
          profileComplete,
          introComplete
        } 
      });
    }
    setLocation('/onboarding-step9');
  };

  const allTasksComplete = profileComplete && introComplete;

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
            {sandboxTask.title}
          </h1>
          <p className="text-lg text-gray-600 font-light">
            {sandboxTask.description}
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
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Instructions
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {sandboxTask.instructions.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Completion Checklist
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setProfileComplete(!profileComplete)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                      profileComplete 
                        ? 'bg-green-50 border-2 border-green-300' 
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid="button-profile-complete"
                  >
                    {profileComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className={`font-medium ${profileComplete ? 'text-green-800' : 'text-gray-700'}`}>
                        I've updated my profile with a photo and bio
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setIntroComplete(!introComplete)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                      introComplete 
                        ? 'bg-green-50 border-2 border-green-300' 
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid="button-intro-complete"
                  >
                    {introComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-500" />
                      <span className={`font-medium ${introComplete ? 'text-green-800' : 'text-gray-700'}`}>
                        I've posted my introduction to the team
                      </span>
                    </div>
                  </button>
                </div>

                {allTasksComplete && (
                  <div className="mt-4 p-4 bg-green-100 rounded-xl text-center">
                    <p className="text-green-800 font-medium">
                      Great job! You're all set to continue.
                    </p>
                  </div>
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
            data-testid="button-continue-step8"
            aria-label="Continue to reflection"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="mt-3 text-sm text-gray-500">
            You can continue even if not complete - we'll remind you later
          </p>
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
          page="onboarding step 8 — first sandbox task"
        />
      )}
    </div>
  );
}
