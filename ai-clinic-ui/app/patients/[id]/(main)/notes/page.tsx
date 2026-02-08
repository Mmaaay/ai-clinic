import { getPatientNotesById } from "@/lib/server/get-patient-notes-by-id";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import PatientNotesSection from "./_patient-notes";

interface NotesPageProps {
  params: Promise<{ id: string }>;
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { id } = await params;
  const notesData = await getPatientNotesById({ patientId: id });
  const safeNotesData = notesData || [];
  const queryClient = new QueryClient();
  queryClient.setQueryData(["patient", "notes", id], safeNotesData);

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientNotesSection id={id} />
      </HydrationBoundary>
    </div>
  );
}
