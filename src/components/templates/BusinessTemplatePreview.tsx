import React from "react";

interface Props {
  selected?: boolean;
  onSelect?: () => void;
}

export default function BusinessTemplatePreview({ selected, onSelect }: Props) {
  return (
    <div
      className={`
        border rounded p-6 cursor-pointer bg-white shadow-sm
        transition hover:shadow-md
        ${selected ? "border-black ring-2 ring-black" : "border-gray-300"}
      `}
      onClick={onSelect}
    >
      <h2 className="text-xl font-bold mb-2">Business IFRS Template</h2>
      <p className="text-gray-600 text-sm mb-4">
        Full IFRS-compliant chart of accounts with assets, liabilities, equity,
        revenue, expenses, cash flow roles, and tax classifications.
      </p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <span>✔ Assets & Liabilities</span>
        <span>✔ Equity Structure</span>
        <span>✔ Revenue & Expenses</span>
        <span>✔ Cost of Sales</span>
        <span>✔ IFRS Cash Flow Roles</span>
        <span>✔ Deferred Tax Support</span>
      </div>
    </div>
  );
}
