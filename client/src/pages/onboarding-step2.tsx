import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";

export default function OnboardingStep2() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Get the user's first name
  const getFirstName = () => {
    const fullName = user?.displayName || user?.email?.split("@")[0] || "";
    const firstName = fullName.split(" ")[0];
    return firstName || "there";
  };

  useEffect(() => {
    // Update onboarding step when component mounts (only once)
    if (user?.email) {
      updateProgress({ onboardingStep: 2 });
    }
  }, [user?.email]); // Remove updateProgress from dependency to prevent loops

  useEffect(() => {
    // Staggered animations
    const timers = [
      setTimeout(() => setShowTitle(true), 300),
      setTimeout(() => setShowList(true), 800),
      setTimeout(() => setShowButton(true), 2500),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const handleContinue = () => {
    // Update progress to step 3 before navigating
    if (user?.email) {
      updateProgress({ onboardingStep: 3 });
    }
    // Navigate to step 3
    setLocation('/onboarding-step3');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      {/* Hamburger menu in top left corner */}
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>

      <div className="w-full max-w-4xl">
        {/* Title */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-4">
            Here's what we'll cover together
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Your personalized journey through {user?.displayName?.includes('@') ? 'our company' : 'Cadet'}
          </p>
        </div>

        {/* Company Information Grid */}
        <div
          className={`grid md:grid-cols-2 gap-8 mb-12 transition-all duration-1000 delay-500 ${
            showList ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-4 flex items-center">
                <ChevronRight className="h-6 w-6 text-gray-600 mr-2" />
                Company Foundation
              </h2>
              <ul className="space-y-3 text-gray-700 ml-8">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Company background and history
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Culture and values
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Organization overview
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-4 flex items-center">
                <ChevronRight className="h-6 w-6 text-gray-600 mr-2" />
                Policies & Benefits
              </h2>
              <ul className="space-y-3 text-gray-700 ml-8">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Company policies and procedures
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Benefits package overview
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Employee resources and support
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-4 flex items-center">
                <ChevronRight className="h-6 w-6 text-gray-600 mr-2" />
                Ongoing Support
              </h2>
              <ul className="space-y-3 text-gray-700 ml-8">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Learning internal processes
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Internal approvers and contacts
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Product information and details
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-4 flex items-center">
                <ChevronRight className="h-6 w-6 text-gray-600 mr-2" />
                Your Success
              </h2>
              <ul className="space-y-3 text-gray-700 ml-8">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Performance expectations
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Goal setting and development
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Career growth opportunities
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Continue Arrow */}
        <div className="text-center">
          <div
            className={`transition-all duration-1000 ${
              showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
              data-testid="button-continue-step3"
              onClick={handleContinue}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}