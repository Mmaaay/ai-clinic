import { getPatientById } from "@/lib/server/patient-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";
import PatientOverview from "./_patient-overview";

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patientData = await getPatientById({ patientId: id });

  if (!patientData) {
    notFound();
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", id], patientData);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PatientOverview id={id} />
    </HydrationBoundary>
  );
}
