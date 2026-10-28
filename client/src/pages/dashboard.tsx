import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  BookOpen,
  FolderOpen,
  ArrowRight,
  FileText,
  CloudUpload,
  Briefcase,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/authContext";

interface UserProgress {
  onboardingStep?: number;
  onboardingCompletedAt?: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: [`/api/user-progress/${user?.email}`],
    enabled: !!user?.email,
  });

  const hasCompletedOnboarding = userProgress?.onboardingCompletedAt || 
    (userProgress?.onboardingStep && userProgress.onboardingStep >= 9);

  const onboardingFeature = {
    icon: <Briefcase className="text-white text-xl" />,
    title: "Onboarding",
    description: "Start your guided onboarding journey with personalized assistance.",
    path: "/onboarding",
    bgClass: "from-blue-50 to-blue-100",
    iconBgClass: "bg-blue-500",
    linkClass: "text-blue-600 hover:text-blue-700",
  };

  const helpCenterFeature = {
    icon: <HelpCircle className="text-white text-xl" />,
    title: "Help Center",
    description: "Access resources, FAQs, and get support for any questions.",
    path: "/onboarding-help-center",
    bgClass: "from-blue-50 to-blue-100",
    iconBgClass: "bg-blue-500",
    linkClass: "text-blue-600 hover:text-blue-700",
  };

  const baseFeatures = [
    {
      icon: <Bot className="text-white text-xl" />,
      title: "AI Assistant",
      description: "Get instant answers to your questions about job skills and career paths.",
      path: "/chatbot",
      bgClass: "from-primary-50 to-primary-100",
      iconBgClass: "bg-primary-500",
      linkClass: "text-primary-600 hover:text-primary-700",
    },
    {
      icon: <BookOpen className="text-white text-xl" />,
      title: "Materials",
      description: "Generate custom learning materials like presentations and notes.",
      path: "/study-materials",
      bgClass: "from-green-50 to-green-100",
      iconBgClass: "bg-secondary-500",
      linkClass: "text-secondary-500 hover:text-secondary-600",
    },
    {
      icon: <FolderOpen className="text-white text-xl" />,
      title: "Document Repository",
      description: "Access and upload resources for onboarding and training.",
      path: "/repository",
      bgClass: "from-purple-50 to-purple-100",
      iconBgClass: "bg-accent-500",
      linkClass: "text-accent-500 hover:text-accent-600",
    },
  ];

  const features = hasCompletedOnboarding 
    ? [helpCenterFeature, ...baseFeatures]
    : [onboardingFeature, ...baseFeatures];

  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-800 mb-6">
          Welcome Back,{" "}
          {user?.displayName ? user.displayName.split(" ")[0] : "User"}!
        </h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">
              Get Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${feature.bgClass} rounded-lg p-6 hover:shadow-md transition`}
                >
                  <div
                    className={`w-12 h-12 ${feature.iconBgClass} rounded-lg flex items-center justify-center mb-4`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-medium text-neutral-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.path}
                    className={`inline-flex items-center text-sm font-medium ${feature.linkClass}`}
                  >
                    Start now <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-neutral-800">
                Recent Activity
              </h2>
              <Link
                href="#"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-start p-3 hover:bg-neutral-50 rounded-lg">
                <Avatar className="h-10 w-10 rounded-full bg-primary-100 mr-4">
                  <AvatarFallback className="text-primary-600">
                    <MessageSquare className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">
                    You asked about "interview preparation techniques" in AI
                    Assistant
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Today at 10:23 AM
                  </p>
                </div>
              </div>

              <div className="flex items-start p-3 hover:bg-neutral-50 rounded-lg">
                <Avatar className="h-10 w-10 rounded-full bg-green-100 mr-4">
                  <AvatarFallback className="text-green-600">
                    <FileText className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">
                    You generated "JavaScript Basics" flashcards
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Yesterday at 4:15 PM
                  </p>
                </div>
              </div>

              <div className="flex items-start p-3 hover:bg-neutral-50 rounded-lg">
                <Avatar className="h-10 w-10 rounded-full bg-purple-100 mr-4">
                  <AvatarFallback className="text-purple-600">
                    <CloudUpload className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">
                    You uploaded "Resume Template - 2023" to the repository
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Two days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
