import { getPatientFollowupById } from "@/lib/server/patient-followup-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientFollowupSection from "./_patient-followup-section";

interface FollowupPageProps {
  params: Promise<{ id: string }>;
}

export default async function FollowupPage({ params }: FollowupPageProps) {
  const { id } = await params;
  const followupData = await getPatientFollowupById({ patientId: id });
  const safeFollowupData = followupData || [];
  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "followup", id], safeFollowupData);

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientFollowupSection id={id} />
      </HydrationBoundary>
    </div>
  );
}
