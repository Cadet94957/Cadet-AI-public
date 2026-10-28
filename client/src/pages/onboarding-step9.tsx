import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ChatWidget } from "../components/ChatWidget";
import { useLocation } from "wouter";

export default function OnboardingStep9() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [reflection, setReflection] = useState({
    clear: "",
    confusing: "",
    questions: "",
  });
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (user?.email) {
      updateProgress({ onboardingStep: 9 });
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

  const handleComplete = () => {
    if (user?.email) {
      updateProgress({ 
        onboardingStep: 9, 
        onboardingData: { reflection },
        onboardingCompletedAt: new Date().toISOString()
      });
    }
    setLocation('/chatbot');
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
          className={`text-center mb-12 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-4">
            End-of-Day Reflection
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Share your thoughts about your first day
          </p>
        </div>

        <div
          className={`space-y-6 mb-8 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 mb-2 block">
                What felt clear and well-explained?
              </span>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={4}
                value={reflection.clear}
                onChange={(e) => setReflection((r) => ({ ...r, clear: e.target.value }))}
                placeholder="Share what made sense to you..."
                data-testid="textarea-clear"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 mb-2 block">
                What felt confusing or unclear?
              </span>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={4}
                value={reflection.confusing}
                onChange={(e) => setReflection((r) => ({ ...r, confusing: e.target.value }))}
                placeholder="Let us know what we can explain better..."
                data-testid="textarea-confusing"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 mb-2 block">
                What questions do you still have?
              </span>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={4}
                value={reflection.questions}
                onChange={(e) => setReflection((r) => ({ ...r, questions: e.target.value }))}
                placeholder="Ask anything you'd like to know more about..."
                data-testid="textarea-questions"
              />
            </label>
          </div>
        </div>

        <div
          className={`text-center transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleComplete}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105 font-medium"
            data-testid="button-complete-onboarding"
          >
            Complete Onboarding
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          page="onboarding step 9 — onboarding complete, next steps"
        />
      )}
    </div>
  );
}
