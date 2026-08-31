import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Project } from "@/lib/cutting/types";

const GUEST_KEY = "cutly_guest_id";
const GUEST_PROJECTS_KEY = "cutly_guest_projects";

export function getGuestId(): string {
  if (typeof window === "undefined") return "guest";
  let id = window.localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    window.localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function isGuest(): boolean {
  return !getSupabaseBrowser();
}

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function loadLocalProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistLocalProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(projects));
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function listProjects(): Promise<Project[]> {
  const userId = await currentUserId();
  if (!userId) return loadLocalProjects();

  const supabase = getSupabaseBrowser()!;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listProjects error", error);
    return [];
  }

  return (data ?? []).map(mapRowToProject);
}

interface ProjectRow {
  id: string;
  name: string;
  parts: unknown;
  settings: unknown;
  result: unknown;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    tenant_id: null,
    user_id: null,
    name: row.name,
    parts: Array.isArray(row.parts) ? row.parts : [],
    settings: (row.settings as Project["settings"]) ?? defaultProjectSettings(),
    result: (row.result as Project["result"]) ?? null,
    status: row.status === "optimized" ? "optimized" : "draft",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function defaultProjectSettings() {
  return {
    sheetWidth: 2440,
    sheetHeight: 1220,
    kerf: 3.5,
    trim: 10,
    allowRotation: true,
  };
}

export function createEmptyProject(): Project {
  const now = new Date().toISOString();
  return {
    id: newId(),
    tenant_id: null,
    user_id: null,
    name: "",
    parts: [],
    settings: defaultProjectSettings(),
    status: "draft",
    result: null,
    created_at: now,
    updated_at: now,
  };
}

export async function getProject(id: string): Promise<Project | null> {
  const userId = await currentUserId();
  if (!userId) {
    return loadLocalProjects().find((p) => p.id === id) ?? null;
  }

  const supabase = getSupabaseBrowser()!;
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToProject(data);
}

export async function saveProject(project: Project): Promise<Project> {
  const userId = await currentUserId();
  const now = new Date().toISOString();
  const updated = { ...project, updated_at: now };

  if (!userId) {
    const all = loadLocalProjects();
    const idx = all.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      all[idx] = updated;
    } else {
      all.unshift(updated);
    }
    persistLocalProjects(all);
    return updated;
  }

  const supabase = getSupabaseBrowser()!;
  const row = {
    id: project.id,
    name: project.name,
    parts: project.parts,
    settings: project.settings,
    result: project.result,
    status: project.status,
  };

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("projects").update(row).eq("id", project.id);
    if (error) {
      console.error("saveProject update error", error);
      throw new Error("ذخیره‌سازی ناموفق بود");
    }
  } else {
    const { error } = await supabase.from("projects").insert(row);
    if (error) {
      console.error("saveProject insert error", error);
      throw new Error("ذخیره‌سازی ناموفق بود");
    }
  }
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) {
    persistLocalProjects(loadLocalProjects().filter((p) => p.id !== id));
    return;
  }
  const supabase = getSupabaseBrowser()!;
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    console.error("deleteProject error", error);
    throw new Error("حذف ناموفق بود");
  }
}
