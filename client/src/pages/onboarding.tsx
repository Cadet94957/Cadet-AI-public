import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface UserProgress {
  onboardingStep?: number;
  onboardingCompletedAt?: string;
}

export default function Onboarding() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showGreeting, setShowGreeting] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [checkedCompletion, setCheckedCompletion] = useState(false);

  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: [`/api/user-progress/${user?.email}`],
    enabled: !!user?.email,
  });

  // Check if user has completed onboarding and redirect to Help Center
  useEffect(() => {
    if (userProgress && !checkedCompletion) {
      setCheckedCompletion(true);
      const hasCompleted = userProgress.onboardingCompletedAt || 
                           (userProgress.onboardingStep && userProgress.onboardingStep >= 9);
      
      if (hasCompleted) {
        setLocation('/onboarding-help-center');
      }
    }
  }, [userProgress, checkedCompletion, setLocation]);

  // Get the user's first name with proper fallbacks
  const getFirstName = () => {
    const fullName = user?.displayName || user?.email?.split("@")[0] || "";
    const firstName = fullName.split(" ")[0];
    return firstName || "there";
  };

  // Company name - can be made configurable later
  const companyName = "Cadet";

  useEffect(() => {
    // Update onboarding step when component mounts (only once)
    if (user?.email && checkedCompletion) {
      // Only update progress if not already completed
      if (!userProgress?.onboardingCompletedAt && (!userProgress?.onboardingStep || userProgress.onboardingStep < 9)) {
        updateProgress({ onboardingStep: 1 });
      }
    }
  }, [user?.email, checkedCompletion, userProgress]);

  useEffect(() => {
    // Staggered text materialization animations
    const timers = [
      setTimeout(() => setShowGreeting(true), 500),
      setTimeout(() => setShowCongrats(true), 1200),
      setTimeout(() => setShowDescription(true), 2000),
      setTimeout(() => setShowButton(true), 2800),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      {/* Hamburger menu in top left corner */}
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>
      <div className="w-full max-w-2xl text-center">
        {/* Animated Welcome Text with Staggered Appearance */}

        {/* User's Name */}
        <div
          className={`mb-8 transition-all duration-1000 ${showGreeting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800">
            Hi {getFirstName()}
          </h1>
        </div>

        {/* Congratulations Message */}
        <div
          className={`mb-8 transition-all duration-1000 ${showCongrats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h2 className="text-2xl font-light tracking-wide text-gray-700 mb-6">
            Congratulations on joining {companyName}!
          </h2>
          <h2 className="text-2xl font-light tracking-wide text-gray-700">
            We're stoked to have you on board.
          </h2>
        </div>

        {/* Description */}
        <div
          className={`mb-12 transition-all duration-1000 ${showDescription ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-2xl font-light text-gray-600 leading-relaxed max-w-4xl mx-auto">
            This is Cadet, the onboarding assistant {companyName} uses to help
            you get through all of your standard onboarding but also to help you
            get up to speed in your new position faster than ever.
          </p>
        </div>

        {/* Continue Arrow */}
        <div
          className={`text-center transition-all duration-1000 ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <button
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
            data-testid="button-continue"
            onClick={() => {
              setLocation('/onboarding-step2');
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
