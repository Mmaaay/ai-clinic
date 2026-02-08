import { getPatientVisitsById } from "@/lib/server/get-patient-visits-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientVisitsSection from "./_patient-visits";

interface VisitsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VisitsPage({ params }: VisitsPageProps) {
  const { id } = await params;
  const visitsData = await getPatientVisitsById({ patientId: id });
  const safeVisitsData = visitsData || [];
  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "visits", id], safeVisitsData);

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientVisitsSection id={id} />
      </HydrationBoundary>
    </div>
  );
}
