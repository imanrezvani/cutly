"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProjectEditor } from "@/components/projects/project-editor";
import { getProject } from "@/lib/stores/projects";
import type { Project } from "@/lib/cutting/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    getProject(params.id).then((p) => {
      if (mounted) setProject(p ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (project === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-lg font-bold">پروژه یافت نشد</p>
        <Button asChild>
          <Link href="/dashboard">بازگشت به داشبورد</Link>
        </Button>
      </div>
    );
  }

  return <ProjectEditor initialProject={project} />;
}
