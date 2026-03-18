// src/components/tax/TaxTreatmentSelect.tsx
import { useTaxTreatments } from "../../hooks/useTaxTreatments";

function labelize(v: string) {
  return v
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function TaxTreatmentSelect(props: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
}) {
  const { value, onChange, disabled, required, label = "Tax treatment", hint } = props;
  const q = useTaxTreatments();

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>

      {hint && <div className="text-xs text-gray-400">{hint}</div>}

      <select
        className="border rounded px-3 py-2 text-sm w-full bg-white disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || q.isLoading}
      >
        <option value="">
          {q.isLoading ? "Loading tax treatments…" : "Select tax treatment…"}
        </option>

        {(q.data ?? []).map((t) => (
          <option key={t} value={t}>
            {labelize(t)}
          </option>
        ))}
      </select>

      {q.error && (
        <div className="text-xs text-red-600">
          Failed to load tax treatments: {String((q.error as any)?.message ?? q.error)}
        </div>
      )}
    </div>
  );
}