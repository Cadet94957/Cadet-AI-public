import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ChatWidget } from "../components/ChatWidget";
import { useLocation } from "wouter";

export default function OnboardingStep3() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showBlurEffect, setShowBlurEffect] = useState(false);
  const [showAgentIntro, setShowAgentIntro] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [arrowPath, setArrowPath] = useState("");
  const [showGetStarted, setShowGetStarted] = useState(false);
  
  const introRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Update onboarding step when component mounts (only once)
    if (user?.email) {
      updateProgress({ onboardingStep: 3 });
    }
  }, [user?.email]); // Remove updateProgress from dependency to prevent loops

  useEffect(() => {
    // Staggered animations: blur -> intro text -> chat icon -> arrow
    const timers = [
      setTimeout(() => setShowBlurEffect(true), 1000),
      setTimeout(() => setShowAgentIntro(true), 2000),
      setTimeout(() => setShowChatIcon(true), 2800),
      setTimeout(() => setShowArrow(true), 3500),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const handleChatIconClick = () => {
    if (showAgentIntro) {
      // If agent intro is showing, return to step 2 state
      handleReturnToStep2();
    } else {
      setIsChatOpen(true);
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  const handleReturnToStep2 = () => {
    setShowBlurEffect(false);
    setShowAgentIntro(false);
    setShowArrow(false);
    // Keep chat icon visible
    setShowGetStarted(true);
  };

  const handleContinueToStep4 = () => {
    if (user?.email) {
      updateProgress({ onboardingStep: 4 });
    }
    setLocation('/onboarding-step4');
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // If clicking on the overlay background (not the text box), return to step 2
    if (e.target === e.currentTarget) {
      handleReturnToStep2();
    }
  };

  // Calculate dynamic arrow path from intro text box to chat button
  useLayoutEffect(() => {
    const calculateArrowPath = () => {
      if (!introRef.current || !chatRef.current || !showArrow || !showAgentIntro) {
        setArrowPath("");
        return;
      }

      const introRect = introRef.current.getBoundingClientRect();
      const chatRect = chatRef.current.getBoundingClientRect();

      // Start point: center-right of intro text box
      const start = {
        x: introRect.right,
        y: introRect.top + introRect.height / 2
      };

      // End point: top-left of chat button
      const end = {
        x: chatRect.left,
        y: chatRect.top
      };

      const dx = end.x - start.x;
      const dy = end.y - start.y;

      // Control points for smooth curve
      const c1 = {
        x: start.x + 0.35 * dx,
        y: start.y
      };
      const c2 = {
        x: end.x - 0.15 * dx,
        y: end.y - 0.25 * Math.abs(dy)
      };

      // Create curved path
      const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
      setArrowPath(path);
    };

    // Calculate initial path
    calculateArrowPath();

    // Recalculate on resize
    const handleResize = () => {
      setTimeout(calculateArrowPath, 50); // Small delay for layout updates
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showArrow, showAgentIntro, showChatIcon]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      {/* Hamburger menu in top left corner */}
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>

      {/* Step 2 Content - Gets Blurred */}
      <div className="w-full max-w-4xl relative">
        <div
          className={`transition-all duration-1000 ${
            showBlurEffect
              ? "blur-sm opacity-85 pointer-events-none"
              : "blur-none opacity-100"
          }`}
        >
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-4">
              Here's what we'll cover together
            </h1>
            <p className="text-lg text-gray-600 font-light">
              Your personalized journey through {user?.displayName?.includes('@') ? 'our company' : 'Cadet'}
            </p>
          </div>

          {/* Company Information Grid - Same as Step 2 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left Column */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-light text-gray-800 mb-4 flex items-center">
                  <svg className="h-6 w-6 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
                  <svg className="h-6 w-6 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
                  <svg className="h-6 w-6 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
                  <svg className="h-6 w-6 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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

          {/* Continue Section - Exactly matches Step 2 */}
          <div className="text-center">
            {showGetStarted ? (
              <>
                <div className="mb-4">
                  <p className="text-lg text-gray-600 font-light">
                    Let's Get Started!
                  </p>
                </div>
                <div className="transition-all duration-1000 opacity-100 translate-y-0">
                  <button
                    onClick={handleContinueToStep4}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105"
                    data-testid="button-continue-step3"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="transition-all duration-1000 opacity-100 translate-y-0">
                <button
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-600"
                  style={{ visibility: 'hidden', pointerEvents: 'none' }}
                  aria-hidden="true"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Agent Introduction Text Box */}
        {showAgentIntro && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-10 pointer-events-auto cursor-pointer"
            onClick={handleOverlayClick}
          >
            <div
              ref={introRef}
              className={`bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center pointer-events-auto transition-all duration-1000 ${
                showAgentIntro
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              }`}
              data-testid="agent-intro-textbox"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-light text-gray-800 mb-4">
                Have questions along the way?
              </h3>
              <p className="text-gray-600 font-light leading-relaxed">
                While you go through this onboarding, you can click here at any time to use the 
                <span className="font-medium text-gray-800"> onboarding agent</span> and ask any questions!
              </p>
              
            </div>
          </div>
        )}

        {/* Dynamic Curved Arrow from Text Box to Chat Icon */}
        {showArrow && showAgentIntro && arrowPath && (
          <svg
            className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-15 transition-all duration-1000 animate-pulse"
            data-testid="pointing-arrow"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#374151"
                  opacity="0.8"
                />
              </marker>
            </defs>
            <path
              d={arrowPath}
              stroke="#374151"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )}
      </div>

      {/* Chat Icon */}
      {showChatIcon && (
        <div
          className={`fixed bottom-8 right-8 z-20 transition-all duration-1000 ${
            showChatIcon
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-75"
          }`}
        >
          <button
            ref={chatRef}
            onClick={handleChatIconClick}
            className="w-16 h-16 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl font-light shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 animate-bounce"
            data-testid="chat-icon-circle"
            style={{ 
              animationDuration: '2s',
              animationIterationCount: '3'
            }}
          >
            C
          </button>
        </div>
      )}

      {/* Chat Widget */}
      {isChatOpen && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={handleChatClose}
          isOnboarding={true}
          page="onboarding step 3 — company mission and values"
        />
      )}
    </div>
  );
}