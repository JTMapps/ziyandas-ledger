// src/pages/industryCapture/GeneralCaptureWizard.tsx
//
// Routes all 10 generic business capture event types.
// Each sub-wizard pre-filters AccountPicker to the semantically valid
// account types for that journal line, enforcing IFRS normal balance rules
// at the UI layer before the DB ever sees the effects payload.
//
// IFRS NORMAL BALANCE RULES (source: IAS 1 + reference COA study):
//   ASSET     → DEBIT  normal  (Dr to increase, Cr to decrease)
//   LIABILITY → CREDIT normal  (Cr to increase, Dr to decrease)
//   EQUITY    → CREDIT normal  (Cr to increase, Dr to decrease)
//   INCOME    → CREDIT normal  (Cr to increase, Dr to decrease)
//   EXPENSE   → DEBIT  normal  (Dr to increase, Cr to decrease)
//
// EVENT TYPE → IFRS STANDARD MAPPING:
//   CASH_SALE            → IFRS 15 Revenue
//   CREDIT_SALE          → IFRS 15 + IFRS 9 Receivables
//   CASH_EXPENSE         → IAS 1 Expenses
//   EXPENSE_ON_CREDIT    → IAS 37 Accruals
//   ASSET_PURCHASED_CASH → IAS 16 PPE
//   DEPRECIATION         → IAS 16 Depreciation
//   LOAN_RECEIVED        → IFRS 9 Financial Liabilities
//   LOAN_REPAID          → IFRS 9 Derecognition
//   OWNER_INVESTMENT     → IAS 1 / IAS 32 Equity
//   OWNER_WITHDRAWAL     → IAS 1 / IAS 32 Equity

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import AccountPicker from "../../components/pickers/AccountPicker";
import TaxTreatmentSelect from "../../components/tax/TaxTreatmentSelect";

import { useRecordEconomicEvent } from "../../hooks/useEconomicEvents";
import { useEnsureCoA } from "../../hooks/useEnsureCoA";

import { toDateYYYYMMDD } from "../../lib/eventUtils";
import type { EconomicEventType } from "../../domain/events/eventTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI bits
// ─────────────────────────────────────────────────────────────────────────────

function errToString(err: unknown) {
  if (!err) return null;
  return String((err as any)?.message ?? err);
}

function DateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500">Date</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}

function AmountField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500">
        Amount (R)
      </label>
      <input
        type="number"
        min={0}
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border rounded px-3 py-2 text-sm w-full text-right focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}

function DescField({
  value,
  onChange,
  disabled,
  placeholder = "Description (optional)",
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-500">
        Description
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}

function PickerLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      {hint && <div className="text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function JournalPreview({
  lines,
  amount,
}: {
  lines: { side: "Dr" | "Cr"; label: string }[];
  amount: number;
}) {
  const formatted =
    amount > 0
      ? `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`
      : "—";

  return (
    <div className="rounded-lg bg-gray-50 border text-xs font-mono p-3 space-y-1 text-gray-600">
      <div className="text-gray-400 font-sans font-medium text-xs mb-1">
        Journal preview
      </div>
      {lines.map((line, i) => (
        <div key={i} className="flex justify-between">
          <span className={line.side === "Cr" ? "pl-8" : ""}>
            {line.side} {line.label}
          </span>
          <span>{formatted}</span>
        </div>
      ))}
    </div>
  );
}

function WizardShell({
  title,
  subtitle,
  ifrsRef,
  children,
  canSubmit,
  isPending,
  errorMsg,
  onSubmit,
  onCancel,
}: {
  title: string;
  subtitle: string;
  ifrsRef: string;
  children: React.ReactNode;
  canSubmit: boolean;
  isPending: boolean;
  errorMsg: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto space-y-5 pb-8">
      <div>
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-700 mb-3 flex items-center gap-1"
        >
          ← Ledger
        </button>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {subtitle} ·{" "}
          <span className="font-mono text-xs text-gray-400">{ifrsRef}</span>
        </p>
      </div>

      {children}

      {errorMsg && (
        <div className="text-sm text-red-700 rounded bg-red-50 border border-red-200 p-3">
          {errorMsg}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm text-gray-500 hover:text-black disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="bg-black text-white text-sm px-5 py-2 rounded shadow hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {isPending ? "Posting…" : `Post ${title}`}
        </button>
      </div>
    </div>
  );
}

function useWizardState() {
  const [date, setDate] = useState(() => toDateYYYYMMDD());
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  const parsed = Number.isFinite(parseFloat(amount)) ? parseFloat(amount) : 0;

  return { date, setDate, amount, setAmount, parsed, desc, setDesc };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-wizards
// ─────────────────────────────────────────────────────────────────────────────

// 1. CASH SALE — IFRS 15
//    Dr Cash (ASSET, cashOnly)
//    Cr Revenue (INCOME)
function CashSaleForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [cashId, setCashId] = useState("");
  const [revId, setRevId] = useState("");
  const record = useRecordEconomicEvent();

  const canSubmit = !record.isPending && !!cashId && !!revId && parsed > 0;

  return (
    <WizardShell
      title="Cash Sale"
      subtitle="Revenue received in cash"
      ifrsRef="IFRS 15"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "CASH_SALE" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Cash sale — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: cashId, amount: parsed, effect_sign: 1 }, // Dr Cash
              { account_id: revId, amount: parsed, effect_sign: -1 }, // Cr Revenue
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Cash" },
          { side: "Cr", label: "Revenue" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Walk-in customer sale"
      />

      <div>
        <PickerLabel
          label="Dr — Cash account"
          hint="Bank or cash account receiving payment"
        />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Revenue account"
          hint="Income account for this type of sale"
        />
        <AccountPicker
          entityId={entityId}
          value={revId}
          onChange={setRevId}
          allowedTypes={["INCOME"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 2. CREDIT SALE — IFRS 15 + IFRS 9
//    Dr Trade Receivables (ASSET, non-cash)
//    Cr Revenue (INCOME)
function CreditSaleForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [recId, setRecId] = useState("");
  const [revId, setRevId] = useState("");
  const record = useRecordEconomicEvent();

  const canSubmit = !record.isPending && !!recId && !!revId && parsed > 0;

  return (
    <WizardShell
      title="Credit Sale"
      subtitle="Invoice customer — collect later"
      ifrsRef="IFRS 15"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "CREDIT_SALE" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Credit sale — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: recId, amount: parsed, effect_sign: 1 }, // Dr Receivable
              { account_id: revId, amount: parsed, effect_sign: -1 }, // Cr Revenue
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Trade Receivable" },
          { side: "Cr", label: "Revenue" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Invoice #1042 to ACME Ltd"
      />

      <div>
        <PickerLabel
          label="Dr — Receivable account"
          hint="Trade Receivables / Debtors (non-cash asset)"
        />
        <AccountPicker
          entityId={entityId}
          value={recId}
          onChange={setRecId}
          allowedTypes={["ASSET"]}
          cashOnly={false}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Revenue account"
          hint="Income account for this sale"
        />
        <AccountPicker
          entityId={entityId}
          value={revId}
          onChange={setRevId}
          allowedTypes={["INCOME"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 3. CASH EXPENSE — IAS 1
//    Dr Expense (EXPENSE)  [deductible: true → requires tax_treatment]
//    Cr Cash (ASSET, cashOnly)
function CashExpenseForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [expId, setExpId] = useState("");
  const [cashId, setCashId] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("");

  const record = useRecordEconomicEvent();

  const canSubmit =
    !record.isPending &&
    !!expId &&
    !!cashId &&
    parsed > 0 &&
    !!taxTreatment;

  return (
    <WizardShell
      title="Cash Expense"
      subtitle="Expense paid directly from cash"
      ifrsRef="IAS 1"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "CASH_EXPENSE" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Cash expense — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              {
                account_id: expId,
                amount: parsed,
                effect_sign: 1,
                deductible: true,
                tax_treatment: taxTreatment,
              },
              {
                account_id: cashId,
                amount: parsed,
                effect_sign: -1,
                deductible: false,
                tax_treatment: null,
              },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Expense" },
          { side: "Cr", label: "Cash" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Office supplies"
      />

      <TaxTreatmentSelect
        value={taxTreatment}
        onChange={setTaxTreatment}
        required
        disabled={record.isPending}
        label="Tax treatment (expense)"
        hint="Required because this line is deductible in the database"
      />

      <div>
        <PickerLabel
          label="Dr — Expense account"
          hint="The type of expense incurred"
        />
        <AccountPicker
          entityId={entityId}
          value={expId}
          onChange={setExpId}
          allowedTypes={["EXPENSE"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel label="Cr — Cash account" hint="Bank or cash account paying" />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 4. EXPENSE ON CREDIT — IAS 37
//    Dr Expense (EXPENSE)  [deductible: true → requires tax_treatment]
//    Cr Trade Payables (LIABILITY)
function ExpenseOnCreditForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [expId, setExpId] = useState("");
  const [payId, setPayId] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("");

  const record = useRecordEconomicEvent();

  const canSubmit =
    !record.isPending &&
    !!expId &&
    !!payId &&
    parsed > 0 &&
    !!taxTreatment;

  return (
    <WizardShell
      title="Expense on Credit"
      subtitle="Bill received — pay later"
      ifrsRef="IAS 37"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "EXPENSE_ON_CREDIT" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Accrued expense — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              {
                account_id: expId,
                amount: parsed,
                effect_sign: 1,
                deductible: true,
                tax_treatment: taxTreatment,
              },
              {
                account_id: payId,
                amount: parsed,
                effect_sign: -1,
                deductible: false,
                tax_treatment: null,
              },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Expense" },
          { side: "Cr", label: "Trade Payable" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Electricity bill — due next month"
      />

      <TaxTreatmentSelect
        value={taxTreatment}
        onChange={setTaxTreatment}
        required
        disabled={record.isPending}
        label="Tax treatment (expense)"
        hint="Required because this line is deductible in the database"
      />

      <div>
        <PickerLabel label="Dr — Expense account" hint="The expense incurred" />
        <AccountPicker
          entityId={entityId}
          value={expId}
          onChange={setExpId}
          allowedTypes={["EXPENSE"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Payable account"
          hint="Trade Payables / Creditors — money owed to supplier"
        />
        <AccountPicker
          entityId={entityId}
          value={payId}
          onChange={setPayId}
          allowedTypes={["LIABILITY"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 5. ASSET PURCHASE (CASH) — IAS 16
//    Dr Fixed Asset (ASSET, non-cash)
//    Cr Cash (ASSET, cashOnly)
function AssetPurchaseForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [assetId, setAssetId] = useState("");
  const [cashId, setCashId] = useState("");
  const record = useRecordEconomicEvent();

  const sameAccount = !!assetId && !!cashId && assetId === cashId;
  const canSubmit =
    !record.isPending && !!assetId && !!cashId && parsed > 0 && !sameAccount;

  return (
    <WizardShell
      title="Asset Purchase"
      subtitle="Buy a long-term asset for cash"
      ifrsRef="IAS 16"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "ASSET_PURCHASED_CASH" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Asset purchase — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: assetId, amount: parsed, effect_sign: 1 }, // Dr Asset
              { account_id: cashId, amount: parsed, effect_sign: -1 }, // Cr Cash
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Fixed Asset" },
          { side: "Cr", label: "Cash" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Delivery vehicle, production equipment"
      />

      <div>
        <PickerLabel
          label="Dr — Asset account (acquired)"
          hint="Equipment, Vehicles, Property — a non-cash fixed asset"
        />
        <AccountPicker
          entityId={entityId}
          value={assetId}
          onChange={setAssetId}
          allowedTypes={["ASSET"]}
          cashOnly={false}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Cash account (pays out)"
          hint="Only cash/bank accounts shown"
        />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>

      {sameAccount && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          Debit and credit cannot be the same account.
        </p>
      )}
    </WizardShell>
  );
}

// 6. DEPRECIATION — IAS 16
//    Dr Depreciation Expense (EXPENSE) [deductible: true → requires tax_treatment]
//    Cr Accumulated Depreciation (ASSET — contra)
function DepreciationForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [deprExpId, setDeprExpId] = useState("");
  const [accumId, setAccumId] = useState("");
  const [taxTreatment, setTaxTreatment] = useState("");

  const record = useRecordEconomicEvent();
  const canSubmit =
    !record.isPending &&
    !!deprExpId &&
    !!accumId &&
    parsed > 0 &&
    !!taxTreatment;

  return (
    <WizardShell
      title="Depreciation"
      subtitle="Allocate asset cost to expense this period"
      ifrsRef="IAS 16"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "DEPRECIATION" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Depreciation charge — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              {
                account_id: deprExpId,
                amount: parsed,
                effect_sign: 1,
                deductible: true,
                tax_treatment: taxTreatment,
              },
              {
                account_id: accumId,
                amount: parsed,
                effect_sign: -1,
                deductible: false,
                tax_treatment: null,
              },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Depreciation Expense" },
          { side: "Cr", label: "Accumulated Depreciation" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Vehicle depreciation — Q1 2026"
      />

      <TaxTreatmentSelect
        value={taxTreatment}
        onChange={setTaxTreatment}
        required
        disabled={record.isPending}
        label="Tax treatment (depreciation expense)"
        hint="Required because this line is deductible in the database"
      />

      <div>
        <PickerLabel
          label="Dr — Depreciation Expense account"
          hint="An expense account for depreciation charges"
        />
        <AccountPicker
          entityId={entityId}
          value={deprExpId}
          onChange={setDeprExpId}
          allowedTypes={["EXPENSE"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Accumulated Depreciation account"
          hint="Contra-asset (ASSET type) that offsets PPE cost"
        />
        <AccountPicker
          entityId={entityId}
          value={accumId}
          onChange={setAccumId}
          allowedTypes={["ASSET"]}
          cashOnly={false}
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 7. LOAN RECEIVED — IFRS 9
//    Dr Cash (ASSET, cashOnly)
//    Cr Loan Payable (LIABILITY)
function LoanReceivedForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [cashId, setCashId] = useState("");
  const [loanId, setLoanId] = useState("");
  const record = useRecordEconomicEvent();

  const canSubmit = !record.isPending && !!cashId && !!loanId && parsed > 0;

  return (
    <WizardShell
      title="Loan Received"
      subtitle="Borrow funds — creates a liability"
      ifrsRef="IFRS 9"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "LOAN_RECEIVED" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Loan received — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: cashId, amount: parsed, effect_sign: 1 },
              { account_id: loanId, amount: parsed, effect_sign: -1 },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Cash" },
          { side: "Cr", label: "Loan Payable" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. ABSA business loan drawdown"
      />

      <div>
        <PickerLabel
          label="Dr — Cash account (funds received)"
          hint="Bank account receiving the loan proceeds"
        />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Loan Payable account (liability created)"
          hint="Liability account for amount owed to the lender"
        />
        <AccountPicker
          entityId={entityId}
          value={loanId}
          onChange={setLoanId}
          allowedTypes={["LIABILITY"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 8. LOAN REPAID — IFRS 9
//    Dr Loan Payable (LIABILITY) — reduces liability
//    Cr Cash (ASSET, cashOnly)
function LoanRepaidForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [loanId, setLoanId] = useState("");
  const [cashId, setCashId] = useState("");
  const record = useRecordEconomicEvent();

  const canSubmit = !record.isPending && !!loanId && !!cashId && parsed > 0;

  return (
    <WizardShell
      title="Loan Repaid"
      subtitle="Repay principal — record interest separately"
      ifrsRef="IFRS 9"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "LOAN_REPAID" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Loan repayment — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: loanId, amount: parsed, effect_sign: 1 },
              { account_id: cashId, amount: parsed, effect_sign: -1 },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Loan Payable" },
          { side: "Cr", label: "Cash" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="Principal only — record interest via Cash Expense"
      />

      <div>
        <PickerLabel
          label="Dr — Loan Payable account (liability reduced)"
          hint="Same loan account credited when loan was received"
        />
        <AccountPicker
          entityId={entityId}
          value={loanId}
          onChange={setLoanId}
          allowedTypes={["LIABILITY"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Cash account (payment made)"
          hint="Bank account making the repayment"
        />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 9. OWNER INVESTMENT — IAS 32
//    Dr Cash (ASSET, cashOnly)
//    Cr Owner Equity (EQUITY)
function OwnerInvestmentForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [cashId, setCashId] = useState("");
  const [equityId, setEquityId] = useState("");
  const record = useRecordEconomicEvent();

  const canSubmit = !record.isPending && !!cashId && !!equityId && parsed > 0;

  return (
    <WizardShell
      title="Owner Investment"
      subtitle="Capital contributed — not income"
      ifrsRef="IAS 32"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "OWNER_INVESTMENT" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Owner investment — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: cashId, amount: parsed, effect_sign: 1 },
              { account_id: equityId, amount: parsed, effect_sign: -1 },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Cash" },
          { side: "Cr", label: "Owner Equity" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Initial capital injection"
      />

      <div>
        <PickerLabel
          label="Dr — Cash account (funds received)"
          hint="Bank account receiving the investment"
        />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel
          label="Cr — Equity account (owner's capital)"
          hint="Owner's capital, share capital, or contributed equity"
        />
        <AccountPicker
          entityId={entityId}
          value={equityId}
          onChange={setEquityId}
          allowedTypes={["EQUITY"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// 10. OWNER WITHDRAWAL — IAS 32
//     Dr Drawings / Equity (EQUITY)
//     Cr Cash (ASSET, cashOnly)
function OwnerWithdrawalForm({
  entityId,
  onCancel,
}: {
  entityId: string;
  onCancel: () => void;
}) {
  const { date, setDate, amount, setAmount, parsed, desc, setDesc } =
    useWizardState();
  const [drawId, setDrawId] = useState("");
  const [cashId, setCashId] = useState("");
  const record = useRecordEconomicEvent();

  const canSubmit = !record.isPending && !!drawId && !!cashId && parsed > 0;

  return (
    <WizardShell
      title="Owner Withdrawal"
      subtitle="Drawings — reduces equity, not an expense"
      ifrsRef="IAS 32"
      canSubmit={canSubmit}
      isPending={record.isPending}
      errorMsg={errToString(record.error)}
      onCancel={onCancel}
      onSubmit={() =>
        record.mutate(
          {
            entityId,
            eventType: "OWNER_WITHDRAWAL" as EconomicEventType,
            eventDate: date,
            description:
              desc || `Owner withdrawal — R${parsed.toLocaleString("en-ZA")}`,
            effects: [
              { account_id: drawId, amount: parsed, effect_sign: 1 },
              { account_id: cashId, amount: parsed, effect_sign: -1 },
            ],
          },
          { onSuccess: onCancel }
        )
      }
    >
      <JournalPreview
        lines={[
          { side: "Dr", label: "Drawings / Equity" },
          { side: "Cr", label: "Cash" },
        ]}
        amount={parsed}
      />

      <DateField value={date} onChange={setDate} disabled={record.isPending} />
      <AmountField value={amount} onChange={setAmount} disabled={record.isPending} />
      <DescField
        value={desc}
        onChange={setDesc}
        disabled={record.isPending}
        placeholder="e.g. Monthly drawings"
      />

      <div>
        <PickerLabel
          label="Dr — Drawings / Equity account"
          hint="Drawings or Retained Earnings. Reduces equity."
        />
        <AccountPicker
          entityId={entityId}
          value={drawId}
          onChange={setDrawId}
          allowedTypes={["EQUITY"]}
          leafOnly
          disabled={record.isPending}
        />
      </div>

      <div>
        <PickerLabel label="Cr — Cash account (funds leaving)" hint="Bank account being drawn from" />
        <AccountPicker
          entityId={entityId}
          value={cashId}
          onChange={setCashId}
          allowedTypes={["ASSET"]}
          cashOnly
          leafOnly
          disabled={record.isPending}
        />
      </div>
    </WizardShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const WIZARD_MAP: Record<
  string,
  React.ComponentType<{ entityId: string; onCancel: () => void }>
> = {
  CASH_SALE: CashSaleForm,
  CREDIT_SALE: CreditSaleForm,
  CASH_EXPENSE: CashExpenseForm,
  EXPENSE_ON_CREDIT: ExpenseOnCreditForm,
  ASSET_PURCHASED_CASH: AssetPurchaseForm,
  DEPRECIATION: DepreciationForm,
  LOAN_RECEIVED: LoanReceivedForm,
  LOAN_REPAID: LoanRepaidForm,
  OWNER_INVESTMENT: OwnerInvestmentForm,
  OWNER_WITHDRAWAL: OwnerWithdrawalForm,
};

export default function GeneralCaptureWizard() {
  const { entityId } = useParams<{ entityId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const eventType = params.get("type") ?? "";

  const { ensureCoA, ensuring, ensureError } = useEnsureCoA(entityId);

  const [ready, setReady] = useState(false);

  // ✅ StrictMode-safe: latest run wins
  const runId = useRef(0);

  useEffect(() => {
    if (!entityId) return;

    const id = ++runId.current;
    setReady(false);

    (async () => {
      try {
        await ensureCoA();
      } finally {
        if (runId.current === id) setReady(true);
      }
    })();
  }, [entityId, ensureCoA]);

  const WizardForm = useMemo(() => WIZARD_MAP[eventType], [eventType]);

  if (!entityId) {
    return <div className="p-4 text-red-600">Missing entityId in route.</div>;
  }

  if (!ready || ensuring) {
    return (
      <div className="p-6 max-w-lg mx-auto text-sm text-gray-500 space-y-2">
        <div>Preparing chart of accounts…</div>
        {ensureError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {String((ensureError as any)?.message ?? ensureError)}
          </div>
        )}
      </div>
    );
  }

  if (ensureError) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {String((ensureError as any)?.message ?? ensureError)}
        </div>
        <button
          onClick={() => navigate(`/entities/${entityId}/ledger`)}
          className="mt-4 text-sm text-gray-500 hover:text-black"
        >
          ← Back to Ledger
        </button>
      </div>
    );
  }

  if (!WizardForm) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <button
          onClick={() => navigate(`/entities/${entityId}/ledger`)}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Ledger
        </button>
        <h2 className="text-xl font-bold text-red-600">Unknown event type</h2>
        <p className="text-sm text-gray-500">
          <code className="bg-gray-100 px-1 rounded">
            {eventType || "(none)"}
          </code>{" "}
          is not a recognised general capture type. Valid types:{" "}
          {Object.keys(WIZARD_MAP).join(", ")}.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <WizardForm
        entityId={entityId}
        onCancel={() => navigate(`/entities/${entityId}/ledger`)}
      />
    </div>
  );
}