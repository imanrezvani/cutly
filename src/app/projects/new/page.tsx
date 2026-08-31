import type { Metadata } from "next";
import { ProjectEditor } from "@/components/projects/project-editor";

export const metadata: Metadata = {
  title: "پروژه جدید",
  description: "ایجاد پروژه جدید برش پنل در کاتلی",
};

export default function NewProjectPage() {
  return <ProjectEditor />;
}
