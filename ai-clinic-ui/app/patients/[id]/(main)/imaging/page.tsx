import { getPatientImagingById } from "@/lib/server/patient-imaging-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientImagingSection from "./_patient-imaging";

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patientImaging = await getPatientImagingById({ patientId: id });
  const safeImagingData = patientImaging || [];

  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "imaging", id], safeImagingData);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PatientImagingSection id={id} />
    </HydrationBoundary>
  );
}
