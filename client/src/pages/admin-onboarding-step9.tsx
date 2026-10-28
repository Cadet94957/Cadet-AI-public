import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";
import { Plus, Trash2, Loader2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  managerId: string;
}

export default function AdminOnboardingStep9() {
  const { user } = useAuth();
  const { updateProgress } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", name: "", role: "", email: "", department: "", managerId: "" },
  ]);

  useEffect(() => {
    if (user?.email) {
      updateProgress({ adminOnboardingStep: 9 });
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

  const handleMemberChange = (
    id: string,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const handleAddMember = () => {
    setTeamMembers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        role: "",
        email: "",
        department: "",
        managerId: "",
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const validMembers = teamMembers.filter(
        (m) => m.name.trim() && m.role.trim()
      );

      await apiRequest("PATCH", "/api/company-config", {
        orgChart: validMembers,
      });

      if (user?.email) {
        updateProgress({
          adminOnboardingStep: 9,
          adminOnboardingData: { orgChart: validMembers },
          adminOnboardingCompletedAt: new Date().toISOString(),
        });
      }
      setLocation("/onboarding");
    } catch (error) {
      console.error("Failed to save org chart:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getManagerOptions = (currentId: string) => {
    return teamMembers.filter(
      (m) => m.id !== currentId && m.name.trim() !== ""
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{ backgroundColor: "#F8F8F0" }}
    >
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>
      <div className="w-full max-w-4xl">
        <div
          className={`text-center mb-10 transition-all duration-1000 ${
            showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-3">
            Org Chart Setup
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Add team members for the organizational chart new employees will see
          </p>
        </div>

        <div
          className={`space-y-6 transition-all duration-1000 delay-300 ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-700">Team Members</h2>
              </div>
              <button
                onClick={handleAddMember}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all duration-200 font-medium text-sm"
                data-testid="button-add-member"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Add key team members that new employees should know about. You can
              specify reporting relationships using the manager dropdown.
            </p>

            <div className="space-y-4">
              {teamMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-xl p-4 space-y-3"
                  data-testid={`member-item-${idx}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      value={member.name}
                      onChange={(e) =>
                        handleMemberChange(member.id, "name", e.target.value)
                      }
                      placeholder="Full name"
                      data-testid={`input-member-name-${idx}`}
                    />
                    <input
                      type="text"
                      className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      value={member.role}
                      onChange={(e) =>
                        handleMemberChange(member.id, "role", e.target.value)
                      }
                      placeholder="Job title (e.g., Engineering Manager)"
                      data-testid={`input-member-role-${idx}`}
                    />
                    <input
                      type="email"
                      className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      value={member.email}
                      onChange={(e) =>
                        handleMemberChange(member.id, "email", e.target.value)
                      }
                      placeholder="Email address"
                      data-testid={`input-member-email-${idx}`}
                    />
                    <input
                      type="text"
                      className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      value={member.department}
                      onChange={(e) =>
                        handleMemberChange(member.id, "department", e.target.value)
                      }
                      placeholder="Department"
                      data-testid={`input-member-department-${idx}`}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      value={member.managerId}
                      onChange={(e) =>
                        handleMemberChange(member.id, "managerId", e.target.value)
                      }
                      data-testid={`select-member-manager-${idx}`}
                    >
                      <option value="">No manager (top-level)</option>
                      {getManagerOptions(member.id).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} - {m.role}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={teamMembers.length === 1}
                      data-testid={`button-remove-member-${idx}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`text-center mt-10 transition-all duration-1000 delay-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={handleComplete}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-complete"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Complete Setup
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
