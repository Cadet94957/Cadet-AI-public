import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminOnboardingStep3() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/admin-onboarding-step4");
  }, [setLocation]);

  return null;
}
