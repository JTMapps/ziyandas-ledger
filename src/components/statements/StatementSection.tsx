// src/components/statements/StatementSection.tsx

import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function StatementSection({ title, children }: Props) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="border rounded bg-white shadow-sm p-3">{children}</div>
    </section>
  );
}
