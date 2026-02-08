import { getPatientLabsById } from "@/lib/server/patient-labs-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientLabsSection from "./_patient-labs";

interface LabsPageProps {
  params: Promise<{ id: string }>;
}

export default async function LabsPage({ params }: LabsPageProps) {
  const { id } = await params;
  const labsData = await getPatientLabsById({ patientId: id });
  const safeLabsData = labsData || [];
  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "labs", id], safeLabsData);

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientLabsSection id={id} />
      </HydrationBoundary>
    </div>
  );
}
