import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";

/**
 * Admin onboarding step 7: Feedback & launch
 *
 * The final page in the admin onboarding flow.  Administrators can
 * customise the reflection questions that new hires answer at the end
 * of their first day, then complete the setup.  Upon completion the
 * admin is redirected to the main dashboard (chatbot) and the
 * onboarding data is persisted.
 */
export default function AdminOnboardingStep7() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [questions, setQuestions] = useState([
    "What felt clear and well‑explained?",
    "What felt confusing or unclear?",
    "What questions do you still have?",
  ]);

  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 7 });
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

  const handleQuestionChange = (index: number, value: string) => {
    setQuestions((prev) => {
      const newQs = [...prev];
      newQs[index] = value;
      return newQs;
    });
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, ""]);
  };

  const handleComplete = () => {
    if (user?.email) {
      updateProgress({
        adminOnboardingStep: 7,
        adminOnboardingData: { reflectionQuestions: questions },
      });
    }
    setLocation("/admin-onboarding-step8");
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
            Reflection & Launch
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Customise end‑of‑day questions and finish setup
          </p>
        </div>
        <div
          className={`space-y-6 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Reflection questions
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              These questions will be shown to new hires at the end of their
              first day.  Feel free to tailor them to your organisation.
            </p>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <input
                  key={idx}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  placeholder={`Question ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleAddQuestion}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all duration-200 font-medium"
            >
              Add question
            </button>
          </div>
        </div>
        <div
          className={`text-center mt-10 transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleComplete}
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