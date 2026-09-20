import React from 'react';
import { prisma } from '@/lib/db';
import VerificationWorkspace from '@/components/scan-verifier/VerificationWorkspace';
import { notFound } from 'next/navigation';

interface VerifyPageProps {
  params: {
    id: string;
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const scan = await prisma.scanQueue.findUnique({
    where: { id: params.id },
  });

  if (!scan) {
    notFound();
  }

  const serializedScan = {
    id: scan.id,
    image_url: scan.image_url,
    filename: scan.filename,
    status: scan.status,
    extracted_json: scan.extracted_json,
    confidence_score: scan.confidence_score,
    created_at: scan.created_at.toISOString(),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <VerificationWorkspace scan={serializedScan} />
    </div>
  );
}
