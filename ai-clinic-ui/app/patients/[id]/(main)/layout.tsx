// app/patient/[id]/(main)/layout.tsx
import { PatientTabNav } from "@/components/tab-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function PatientMainLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;

  return (
    <div className="w-full h-full p-6">
      {/* Navigation is now a separate component */}
      <PatientTabNav patientId={id} />

      {/* ScrollArea wraps the dynamic page content */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="min-w-0 pr-4">{children}</div>
      </ScrollArea>
    </div>
  );
}
