// src/pages/dashboard/LedgerPage.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { supabase, getEnumValues } from "../../lib/supabase";
import JournalEntryModal from "../../components/events/JournalEntryModal";
import { qk } from "../../hooks/queryKeys";

type LedgerEventRow = {
  id: string;
  event_date: string;
  description: string | null;
  event_type: string | null;
  created_at: string;
};

export default function LedgerPage() {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  const eventTypesQuery = useQuery<string[]>({
    queryKey: qk.enumValues("economic_event_type"),
    queryFn: async () => getEnumValues("economic_event_type"),
    staleTime: 60 * 60 * 1000,
  });

  const eventTypes = useMemo(() => eventTypesQuery.data ?? [], [eventTypesQuery.data]);

  const accountsCountQuery = useQuery<number>({
    queryKey: qk.accountsCount(entityId),
    enabled: !!entityId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .is("deleted_at", null);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const hasAccounts = (accountsCountQuery.data ?? 0) > 0;

  const eventsQuery = useQuery<LedgerEventRow[]>({
    queryKey: qk.economicEvents(entityId),
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events_active")
        .select("id, event_date, description, event_type, created_at")
        .eq("entity_id", entityId)
        .order("event_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as LedgerEventRow[];
    },
  });

  const events = eventsQuery.data ?? [];
  const canOpenModal = hasAccounts && eventTypes.length > 0 && !eventTypesQuery.isLoading;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ledger / Economic Events</h2>

        <button
          type="button"
          className="px-4 py-2 bg-black text-white rounded shadow disabled:opacity-50"
          onClick={() => setShowModal(true)}
          disabled={!canOpenModal}
          title={
            !hasAccounts
              ? "Apply a template to create accounts first."
              : eventTypes.length === 0
                ? "No economic_event_type values found in DB."
                : "Record a journal entry"
          }
        >
          + Record Journal Entry
        </button>
      </div>

      {!accountsCountQuery.isLoading && !hasAccounts && (
        <div className="border rounded p-4 bg-yellow-50 text-sm space-y-2">
          <div className="font-semibold">No accounts found for this entity.</div>
          <div className="text-gray-700">
            This usually means the template wasn’t applied (no chart of accounts was materialized into{" "}
            <code>accounts</code>). Go to the entity’s template setup and apply one.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-3 py-2 rounded bg-blue-600 text-white"
              onClick={() => navigate(`/entities/${entityId}/template`)}
            >
              Go to Template Setup
            </button>

            <button
              type="button"
              className="px-3 py-2 rounded border"
              onClick={() => accountsCountQuery.refetch()}
            >
              Re-check Accounts
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <JournalEntryModal
          entityId={entityId}
          eventTypes={eventTypes}
          onClose={() => setShowModal(false)}
        />
      )}

      {(eventsQuery.error || eventTypesQuery.error || accountsCountQuery.error) && (
        <div className="text-red-600 text-sm whitespace-pre-wrap">
          {eventsQuery.error
            ? `Failed to load events: ${String((eventsQuery.error as any)?.message ?? eventsQuery.error)}\n`
            : ""}
          {eventTypesQuery.error
            ? `Failed to load event types: ${String(
                (eventTypesQuery.error as any)?.message ?? eventTypesQuery.error
              )}\n`
            : ""}
          {accountsCountQuery.error
            ? `Failed to check accounts: ${String(
                (accountsCountQuery.error as any)?.message ?? accountsCountQuery.error
              )}\n`
            : ""}
        </div>
      )}

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-2 border-r">Date</th>
              <th className="p-2 border-r">Description</th>
              <th className="p-2 border-r">Type</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>

          <tbody>
            {eventsQuery.isLoading && (
              <tr>
                <td className="p-4 text-center" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}

            {events.map((ev) => (
              <tr key={ev.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border-r">{ev.event_date}</td>
                <td className="p-2 border-r">{ev.description ?? "—"}</td>
                <td className="p-2 border-r">{ev.event_type ?? "—"}</td>
                <td className="p-2">{new Date(ev.created_at).toLocaleString()}</td>
              </tr>
            ))}

            {!eventsQuery.isLoading && events.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}