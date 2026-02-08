import { getPatientSurgeryById } from "@/lib/server/patient-surgery-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientSurgerySection from "./_patient-surgery-section";

interface SurgeryPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurgeryPage({ params }: SurgeryPageProps) {
  const { id } = await params;
  const surgeryData = await getPatientSurgeryById({ patientId: id });
  const safeSurgeryData = surgeryData || [];
  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "surgery", id], safeSurgeryData);

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientSurgerySection id={id} />
      </HydrationBoundary>
    </div>
  );
}
