"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import {
  LogOut,
  FolderGit2,
  Trash2,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  Folder,
  Layers,
  X,
} from "lucide-react";
import { apiFetchProjects, apiCreateProject, apiDeleteProject } from "@/lib/supabaseClient";
import { ProjectRow } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loadingSession, logout } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // New Project Dialog
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<"blank" | "sample">("blank");
  const [creating, setCreating] = useState(false);

  // Delete Confirmation Dialog
  const [projectToDelete, setProjectToDelete] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loadingSession && !user) {
      router.replace("/login");
    }
  }, [loadingSession, user, router]);

  // Load real projects from database
  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    try {
      const data = await apiFetchProjects();
      setProjects(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      toast.error("Database Error", msg);
    } finally {
      setLoadingProjects(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, loadProjects]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      toast.error("Failed to sign out", err instanceof Error ? err.message : undefined);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || creating) return;
    setCreating(true);
    try {
      const { project } = await apiCreateProject(newProjectName.trim(), selectedTemplate);
      toast.success(`Project "${project.name}" created successfully.`);
      setShowCreateModal(false);
      setNewProjectName("");
      router.push(`/editor?project=${project.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create project";
      toast.error("Creation Failed", msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleting) return;
    setDeleting(true);
    try {
      await apiDeleteProject(projectToDelete.id);
      toast.success(`Deleted project "${projectToDelete.name}".`);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      toast.error("Deletion Failed", msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loadingSession || !user) {
    return (
      <main className="min-h-screen grid place-content-center gap-3 bg-[#F5F2EB] text-[#141A17]">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Opening workspace...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#141A17] font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#FAF8F5] border-b border-[#E6E1D8] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">
            Star<span className="text-indigo-600">graph</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#6558E8]/10 text-[#6558E8] font-medium ml-2">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-[#141A17]">
            {user.email ?? "StarGraph account"}
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 text-[#727974] hover:text-[#141A17] hover:bg-black/5 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-[#FAF8F5] rounded-xl p-8 border border-[#E6E1D8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111714]">
              Diagram Studio
            </h1>
            <p className="text-sm text-[#5A605B] mt-1">
              Manage your engineering architecture, user flows, and database diagrams.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              fullWidth={false}
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-600" />
              <span>Your Projects</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {/* Loading State */}
          {loadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-5 animate-pulse space-y-3"
                >
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded mt-4" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="bg-[#FAF8F5] border border-dashed border-[#DDD8CD] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                No projects yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5">
                Create your first diagramming project or start from a sample template to start collaborating.
              </p>
              <Button
                variant="primary"
                fullWidth={false}
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Project</span>
              </Button>
            </div>
          ) : (
            /* Real Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(proj);
                        }}
                        title="Delete project"
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Updated {new Date(proj.updated_at || proj.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/editor?project=${proj.id}`)}
                    className="w-full py-2 px-3 rounded-lg bg-white border border-[#DDD8CD] hover:border-indigo-500 hover:bg-indigo-50/40 text-slate-700 hover:text-indigo-700 font-medium text-xs flex items-center justify-between transition-all"
                  >
                    <span>Open in Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. E-Commerce Platform, Payments API"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Choose Starter Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedTemplate("blank")}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplate === "blank"
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Blank Canvas</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Start fresh with an empty file tree and blank canvas.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedTemplate("sample")}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplate === "sample"
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Food Delivery App</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Preloaded with Authentication flows, UML Domain Model, and ERD.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || creating}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creating ? "Creating..." : "Create Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Delete Project
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900">&quot;{projectToDelete.name}&quot;</strong> and all of its diagrams and folders? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? "Deleting..." : "Delete Forever"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

