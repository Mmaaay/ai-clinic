"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700">
          Patient Not Found
        </h2>
        <p className="text-slate-600 max-w-md">
          The patient record you&apos;re looking for doesn&apos;t exist or has
          been removed.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/">
            <Button variant="default">View All Patients</Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
