import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/authContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, AlertCircle, Upload, Plus, X } from "lucide-react";
import { COMMON_DEPARTMENTS, COMMON_JOB_TITLES } from "@/lib/orgPresets";

type AdminDocCategory = {
  key: string;
  label: string;
  description: string;
  isEssential: boolean;
  defaultBackendCategory?: string;
};

const ESSENTIAL_DOCS: AdminDocCategory[] = [
  {
    key: "org_chart",
    label: "Org chart or HR export",
    description: "A diagram of your org or an export listing employees, titles, managers, and departments.",
    isEssential: true,
    defaultBackendCategory: "org-structure",
  },
  {
    key: "employee_handbook",
    label: "Employee handbook",
    description: "Your main handbook or 'Welcome to [Company]' document.",
    isEssential: true,
    defaultBackendCategory: "handbook",
  },
  {
    key: "team_overviews",
    label: "Team overview pages",
    description: "Docs describing what each department does.",
    isEssential: true,
    defaultBackendCategory: "team-overview",
  },
  {
    key: "role_onboarding_docs",
    label: "Role descriptions",
    description: "Job descriptions and onboarding checklists.",
    isEssential: true,
    defaultBackendCategory: "role-onboarding",
  },
];

const ADVANCED_DOCS: AdminDocCategory[] = [
  {
    key: "sops_playbooks",
    label: "SOPs & playbooks",
    description: "Workflow docs like sales process or incident response.",
    isEssential: false,
    defaultBackendCategory: "sop",
  },
  {
    key: "raci_matrices",
    label: "RACI matrices",
    description: "Responsibility matrices for key activities.",
    isEssential: false,
    defaultBackendCategory: "raci",
  },
  {
    key: "tool_inventory",
    label: "Tool inventory",
    description: "Lists of internal tools and access matrices.",
    isEssential: false,
    defaultBackendCategory: "tool-inventory",
  },
];

type CategoryUploadState = {
  file: File | null;
  isUploading: boolean;
  success: boolean;
  error: string | null;
  documentId: number | null;
};

type CategoryUploadMap = Record<string, CategoryUploadState>;

export default function AdminOnboardingStep2() {
  const { user } = useAuth();
  const { updateProgressAsync } = useUserProgress(user?.email || null);
  const [, setLocation] = useLocation();
  const [showTitle, setShowTitle] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [customDepartment, setCustomDepartment] = useState("");
  
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [customJobTitle, setCustomJobTitle] = useState("");

  const [roles, setRoles] = useState({
    admin: true,
    manager: true,
    employee: true,
    mentor: false,
  });

  const ALL_DOCS = useMemo(() => [...ESSENTIAL_DOCS, ...ADVANCED_DOCS], []);

  const [modules, setModules] = useState({
    companyFoundation: true,
    policiesBenefits: true,
    ongoingSupport: true,
    yourSuccess: true,
    morningSetup: true,
    orientation: true,
    hrCompliance: true,
    teamIntro: true,
    roleSpecific: true,
    reflection: true,
  });

  const [missionStatement, setMissionStatement] = useState("");

  const [benefitsFile, setBenefitsFile] = useState<File | null>(null);
  const [benefitsIsUploading, setBenefitsIsUploading] = useState(false);
  const [benefitsUploadSuccess, setBenefitsUploadSuccess] = useState(false);
  const [benefitsUploadError, setBenefitsUploadError] = useState<string | null>(null);
  const [benefitsDocumentId, setBenefitsDocumentId] = useState<number | null>(null);

  const [categoryUploads, setCategoryUploads] = useState<CategoryUploadMap>(() => {
    const init: CategoryUploadMap = {};
    for (const c of [...ESSENTIAL_DOCS, ...ADVANCED_DOCS]) {
      init[c.key] = { file: null, isUploading: false, success: false, error: null, documentId: null };
    }
    return init;
  });

  const [isSavingNext, setIsSavingNext] = useState(false);

  useEffect(() => {
    if (user?.email) updateProgressAsync({ adminOnboardingStep: 2 });
  }, [user?.email]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowTitle(true), 300),
      setTimeout(() => setShowContent(true), 800),
      setTimeout(() => setShowButton(true), 1500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const addCustomDepartment = () => {
    const trimmed = customDepartment.trim();
    if (trimmed && !selectedDepartments.includes(trimmed)) {
      setSelectedDepartments((prev) => [...prev, trimmed]);
      setCustomDepartment("");
    }
  };

  const removeCustomDepartment = (dept: string) => {
    setSelectedDepartments((prev) => prev.filter((d) => d !== dept));
  };

  const toggleJobTitle = (title: string) => {
    setSelectedJobTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const addCustomJobTitle = () => {
    const trimmed = customJobTitle.trim();
    if (trimmed && !selectedJobTitles.includes(trimmed)) {
      setSelectedJobTitles((prev) => [...prev, trimmed]);
      setCustomJobTitle("");
    }
  };

  const removeCustomJobTitle = (title: string) => {
    setSelectedJobTitles((prev) => prev.filter((t) => t !== title));
  };

  const toggleRole = (role: keyof typeof roles) => {
    setRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleModule = (key: keyof typeof modules) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBenefitsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBenefitsFile(file);
    setBenefitsUploadSuccess(false);
    setBenefitsUploadError(null);
    setBenefitsDocumentId(null);
  };

  const uploadBenefitsDocument = async (): Promise<number | null> => {
    if (!benefitsFile) return null;

    setBenefitsIsUploading(true);
    setBenefitsUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", benefitsFile);
      formData.append("title", `Company Benefits - ${benefitsFile.name}`);
      formData.append("description", "Company benefits overview uploaded during admin onboarding setup");
      formData.append("category", "onboarding");

      const response = await fetch("/api/documents", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload document");
      }

      const result = await response.json();
      setBenefitsUploadSuccess(true);
      setBenefitsDocumentId(result.id);
      return result.id;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setBenefitsUploadError(msg);
      return null;
    } finally {
      setBenefitsIsUploading(false);
    }
  };

  const handleBenefitsUploadClick = async () => {
    await uploadBenefitsDocument();
  };

  const handleCategoryFileChange = (categoryKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCategoryUploads((prev) => ({
      ...prev,
      [categoryKey]: { file, isUploading: false, success: false, error: null, documentId: null },
    }));
  };

  const uploadCategoryDocument = async (category: AdminDocCategory): Promise<number | null> => {
    const state = categoryUploads[category.key];
    if (!state?.file) return null;

    setCategoryUploads((prev) => ({
      ...prev,
      [category.key]: { ...prev[category.key], isUploading: true, error: null },
    }));

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("title", `${category.label} - ${state.file.name}`);
      formData.append("description", `Admin onboarding upload: "${category.key}".`);
      formData.append("category", "onboarding");

      const response = await fetch("/api/documents", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload document");
      }

      const result = await response.json();
      setCategoryUploads((prev) => ({
        ...prev,
        [category.key]: { ...prev[category.key], isUploading: false, success: true, documentId: result.id, error: null },
      }));
      return result.id;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setCategoryUploads((prev) => ({
        ...prev,
        [category.key]: { ...prev[category.key], isUploading: false, success: false, error: msg },
      }));
      return null;
    }
  };

  const handleUploadCategoryClick = async (category: AdminDocCategory) => {
    await uploadCategoryDocument(category);
  };

  const handleNext = async () => {
    if (!user?.email) return setLocation("/login");

    setIsSavingNext(true);
    try {
      for (const category of ALL_DOCS) {
        const s = categoryUploads[category.key];
        if (s?.file && !s.documentId) await uploadCategoryDocument(category);
      }

      let finalBenefitsDocId = benefitsDocumentId;
      if (benefitsFile && !benefitsUploadSuccess) {
        finalBenefitsDocId = await uploadBenefitsDocument();
      }

      const uploadedCategoryDocs = ALL_DOCS
        .map((category) => {
          const s = categoryUploads[category.key];
          if (!s?.documentId) return null;
          return {
            categoryKey: category.key,
            label: category.label,
            backendCategory: category.defaultBackendCategory ?? "onboarding-doc",
            documentId: s.documentId,
            fileName: s.file?.name ?? null,
          };
        })
        .filter(Boolean);

      await updateProgressAsync({
        adminOnboardingStep: 3,
        adminOnboardingData: {
          departments: selectedDepartments,
          jobTitles: selectedJobTitles,
          roles,
          modules,
          missionStatement,
          benefitsFileName: benefitsFile?.name || null,
          benefitsDocumentId: finalBenefitsDocId,
          documents: uploadedCategoryDocs,
        },
      });

      setLocation("/admin-onboarding-step4");
    } finally {
      setIsSavingNext(false);
    }
  };

  const customDepts = selectedDepartments.filter((d) => !COMMON_DEPARTMENTS.includes(d));
  const customTitles = selectedJobTitles.filter((t) => !COMMON_JOB_TITLES.includes(t));

  const renderCategoryRow = (category: AdminDocCategory) => {
    const s = categoryUploads[category.key];
    return (
      <div
        key={category.key}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-3 border-b last:border-b-0"
        data-testid={`category-row-${category.key}`}
      >
        <div className="flex-1">
          <div className="font-medium text-gray-800 text-sm">{category.label}</div>
          <p className="text-xs text-gray-500">{category.description}</p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 min-w-[180px]">
          <input
            type="file"
            onChange={(e) => handleCategoryFileChange(category.key, e)}
            className="text-xs w-full"
            data-testid={`input-file-${category.key}`}
          />
          {s?.file && <span className="text-xs text-gray-600">{s.file.name}</span>}

          <div className="flex flex-wrap items-center gap-2">
            {s?.file && !s.success && (
              <button
                type="button"
                onClick={() => handleUploadCategoryClick(category)}
                disabled={!!s.isUploading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-white text-xs hover:bg-gray-700 transition-colors disabled:opacity-50"
                data-testid={`button-upload-${category.key}`}
              >
                {s.isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {s.isUploading ? "..." : "Upload"}
              </button>
            )}
            {s?.success && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            {s?.error && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" /> {s.error}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative" style={{ backgroundColor: "#F8F8F0" }}>
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu />
      </div>

      <div className="w-full max-w-4xl">
        <div className={`text-center mb-8 transition-all duration-1000 ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-3">
            Company Structure & Knowledge
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Select your departments, job titles, and upload key documents.
          </p>
        </div>

        <div className={`space-y-6 transition-all duration-1000 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Departments</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {COMMON_DEPARTMENTS.map((dept) => (
                <label
                  key={dept}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedDepartments.includes(dept)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                  data-testid={`dept-${dept.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedDepartments.includes(dept)}
                    onChange={() => toggleDepartment(dept)}
                  />
                  <span className="text-sm">{dept}</span>
                </label>
              ))}
            </div>
            {customDepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {customDepts.map((dept) => (
                  <span key={dept} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
                    {dept}
                    <button onClick={() => removeCustomDepartment(dept)} className="hover:text-gray-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customDepartment}
                onChange={(e) => setCustomDepartment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomDepartment())}
                placeholder="Add custom department"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                data-testid="input-custom-department"
              />
              <button
                type="button"
                onClick={addCustomDepartment}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                data-testid="button-add-department"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Job Titles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {COMMON_JOB_TITLES.map((title) => (
                <label
                  key={title}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedJobTitles.includes(title)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                  data-testid={`title-${title.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedJobTitles.includes(title)}
                    onChange={() => toggleJobTitle(title)}
                  />
                  <span className="text-sm">{title}</span>
                </label>
              ))}
            </div>
            {customTitles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {customTitles.map((title) => (
                  <span key={title} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
                    {title}
                    <button onClick={() => removeCustomJobTitle(title)} className="hover:text-gray-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customJobTitle}
                onChange={(e) => setCustomJobTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomJobTitle())}
                placeholder="Add custom job title"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                data-testid="input-custom-job-title"
              />
              <button
                type="button"
                onClick={addCustomJobTitle}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                data-testid="button-add-job-title"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">User Roles</h2>
            <div className="flex flex-wrap gap-4">
              {Object.keys(roles).map((role) => (
                <label key={role} className="inline-flex items-center space-x-2" data-testid={`role-${role}`}>
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-black border-gray-300"
                    checked={roles[role as keyof typeof roles]}
                    onChange={() => toggleRole(role as keyof typeof roles)}
                  />
                  <span className="text-gray-700 capitalize">{role}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Enable or disable roles for Cadet permissions.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Essential Documents</h2>
            <p className="text-sm text-gray-500 mb-4">Upload these to give Cadet context about your company.</p>
            <div className="divide-y divide-gray-100">{ESSENTIAL_DOCS.map(renderCategoryRow)}</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Advanced Documents (Optional)</h2>
            <p className="text-sm text-gray-500 mb-4">Helps Cadet answer nuanced questions about workflows.</p>
            <div className="divide-y divide-gray-100">{ADVANCED_DOCS.map(renderCategoryRow)}</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(modules).map((key) => (
                <label key={key} className="inline-flex items-center space-x-2" data-testid={`module-${key}`}>
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-black border-gray-300"
                    checked={modules[key as keyof typeof modules]}
                    onChange={() => toggleModule(key as keyof typeof modules)}
                  />
                  <span className="text-gray-700 text-sm">
                    {key.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Mission & Values</h2>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={3}
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              placeholder="Share your mission statement and core values here"
              data-testid="input-mission-statement"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Benefits Overview (Optional)</h2>
            <div className="flex items-center gap-4 mb-3">
              <input
                type="file"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleBenefitsFileChange}
                className="flex-1"
                data-testid="input-benefits-file"
              />
              {benefitsFile && !benefitsUploadSuccess && (
                <button
                  onClick={handleBenefitsUploadClick}
                  disabled={benefitsIsUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  data-testid="button-upload-benefits"
                >
                  {benefitsIsUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Now
                    </>
                  )}
                </button>
              )}
            </div>
            {benefitsFile && <div className="text-sm text-gray-600 mb-2">Selected: {benefitsFile.name}</div>}
            {benefitsUploadSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 mb-2" data-testid="status-upload-success">
                <CheckCircle2 className="w-4 h-4" />
                Document uploaded successfully.
              </div>
            )}
            {benefitsUploadError && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2" data-testid="status-upload-error">
                <AlertCircle className="w-4 h-4" />
                {benefitsUploadError}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              This helps new hires quickly get answers about benefits and HR policies.
            </p>
          </div>
        </div>

        <div className={`text-center mt-10 transition-all duration-1000 delay-500 ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={handleNext}
            disabled={isSavingNext}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all duration-200 hover:scale-105 font-medium disabled:opacity-50"
            data-testid="button-next"
          >
            {isSavingNext ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
