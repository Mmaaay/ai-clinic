import { PatientsTable } from "@/components/patients/patients-table";
import { getPatientsData } from "@/lib/server/patients";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function Home() {
  const patients = await getPatientsData();

  if (patients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          No patients found. Please add patients to get started.
        </h1>
      </div>
    );
  }
  const queryClient = new QueryClient();
  await queryClient.setQueryData(["patients"], patients);

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <PatientsTable patients={patients} />
        </HydrationBoundary>
      </main>
    </div>
  );
}
