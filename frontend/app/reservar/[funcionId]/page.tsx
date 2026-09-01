"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReservarRedirectPage({
  params,
}: {
  params: Promise<{ funcionId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    router.replace(`/reservar/${resolvedParams.funcionId}/entradas`);
  }, [router, resolvedParams.funcionId]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8B86A] border-t-transparent" />
    </div>
  );
}
