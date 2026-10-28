import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/authContext';
import MainLayout from './components/layout/MainLayout';
import { PageTracker } from './components/PageTracker';
import Dashboard from './pages/dashboard';
import Chatbot from './pages/chatbot';
import StudyMaterials from './pages/study-materials';
import Repository from './pages/repository';
import ManagerDashboard from './pages/manager-dashboard';
import ManagerEmployees from './pages/manager-employees';
import ManagerRepository from './pages/manager-repository';
import ManagerStudyMaterials from './pages/manager-study-materials';
import ManagerChatbot from './pages/manager-chatbot';
import Onboarding from './pages/onboarding';
import OnboardingStep2 from './pages/onboarding-step2';
import OnboardingStep3 from './pages/onboarding-step3';
import OnboardingStep4 from './pages/onboarding-step4';
import OnboardingStep5 from './pages/onboarding-step5';
import OnboardingStep6 from './pages/onboarding-step6';
import OnboardingStep7 from './pages/onboarding-step7';
import OnboardingStep8 from './pages/onboarding-step8';
import OnboardingStep9 from './pages/onboarding-step9';
import AdminOnboardingStep1 from './pages/admin-onboarding-step1';
import AdminOnboardingStep2 from './pages/admin-onboarding-step2';
import AdminOnboardingStep3 from './pages/admin-onboarding-step3';
import AdminOnboardingStep4 from './pages/admin-onboarding-step4';
import AdminOnboardingStep5 from './pages/admin-onboarding-step5';
import AdminOnboardingStep6 from './pages/admin-onboarding-step6';
import AdminOnboardingStep7 from './pages/admin-onboarding-step7';
import AdminOnboardingStep8 from './pages/admin-onboarding-step8';
import AdminOnboardingStep9 from './pages/admin-onboarding-step9';
import ManagerOnboarding from './pages/manager-onboarding';
import { CloudIntegrations } from './pages/cloud-integrations';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import NotFound from './pages/not-found';
import Login from './pages/login.tsx';
import Settings from './pages/settings.tsx';
import AuthGuard from './components/AuthGuard.tsx';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={100}>
        <AuthProvider>
          <PageTracker />
          <Switch>
            <Route path="/login" component={Login} />
            
            {/* Admin onboarding pages without layout */}
            <Route path="/admin-onboarding-step1">
              <AuthGuard>
                <AdminOnboardingStep1 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step2">
              <AuthGuard>
                <AdminOnboardingStep2 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step3">
              <AuthGuard>
                <AdminOnboardingStep3 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step4">
              <AuthGuard>
                <AdminOnboardingStep4 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step5">
              <AuthGuard>
                <AdminOnboardingStep5 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step6">
              <AuthGuard>
                <AdminOnboardingStep6 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step7">
              <AuthGuard>
                <AdminOnboardingStep7 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step8">
              <AuthGuard>
                <AdminOnboardingStep8 />
              </AuthGuard>
            </Route>
            
            <Route path="/admin-onboarding-step9">
              <AuthGuard>
                <AdminOnboardingStep9 />
              </AuthGuard>
            </Route>
            
            {/* Employee onboarding pages without layout */}
            <Route path="/onboarding">
              <AuthGuard>
                <Onboarding />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step2">
              <AuthGuard>
                <OnboardingStep2 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step3">
              <AuthGuard>
                <OnboardingStep3 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step4">
              <AuthGuard>
                <OnboardingStep4 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step5">
              <AuthGuard>
                <OnboardingStep5 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step6">
              <AuthGuard>
                <OnboardingStep6 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step7">
              <AuthGuard>
                <OnboardingStep7 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step8">
              <AuthGuard>
                <OnboardingStep8 />
              </AuthGuard>
            </Route>
            
            <Route path="/onboarding-step9">
              <AuthGuard>
                <OnboardingStep9 />
              </AuthGuard>
            </Route>
            
            <Route>
              <AuthGuard>
                <MainLayout>
                  <Switch>
                    <Route path="/" component={RoleBasedRedirect} />
                  
                  {/* Employee routes */}
                  <Route path="/chatbot" component={Chatbot} />
                  <Route path="/onboarding-help-center" component={Chatbot} />
                  <Route path="/study-materials" component={StudyMaterials} />
                  <Route path="/repository" component={Repository} />
                  
                  {/* Manager routes */}
                  <Route path="/manager" component={ManagerDashboard} />
                  <Route path="/manager-dashboard" component={ManagerDashboard} />
                  <Route path="/manager/onboarding" component={ManagerOnboarding} />
                  <Route path="/manager/employees" component={ManagerEmployees} />
                  <Route path="/manager/repository" component={ManagerRepository} />
                  <Route path="/manager/study-materials" component={ManagerStudyMaterials} />
                  <Route path="/manager/chatbot" component={ManagerChatbot} />
                  <Route path="/manager/cloud-integrations" component={CloudIntegrations} />
                  
                  {/* Shared routes */}
                  <Route path="/cloud-integrations" component={CloudIntegrations} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/settings" component={Settings} />
                  
                  <Route component={NotFound} />
                </Switch>
              </MainLayout>
              </AuthGuard>
            </Route>
          </Switch>
        </AuthProvider>
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
