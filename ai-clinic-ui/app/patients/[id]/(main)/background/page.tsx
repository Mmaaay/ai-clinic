import { getPatientBackgroundById } from "@/lib/server/patient-background-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientBackgroundSection from "./_patient-background";

export default async function BackgroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patientBackgroundData = await getPatientBackgroundById({
    patientId: id,
  });
  const safeBackgroundData = patientBackgroundData || {
    allergies: [],
    conditions: [],
    medications: [],
    surgeries: [],
    socialHistory: [],
  };
  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "background", id], safeBackgroundData);

  return (
    <div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientBackgroundSection patientId={id} />
      </HydrationBoundary>
    </div>
  );
}
