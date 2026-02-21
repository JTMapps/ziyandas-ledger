// src/pages/dashboard/LedgerPage.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

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
  const [showModal, setShowModal] = useState(false);

  if (!entityId) return <div className="p-4">Missing entityId in route.</div>;

  // Load DB enum values for event type dropdowns (economic_event_type)
  const eventTypesQuery = useQuery<string[]>({
    queryKey: ["enum", "economic_event_type"],
    queryFn: async () => getEnumValues("economic_event_type"),
    staleTime: 60 * 60 * 1000,
  });

  const eventTypes = useMemo(() => eventTypesQuery.data ?? [], [eventTypesQuery.data]);

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ledger / Economic Events</h2>

        <button
          className="px-4 py-2 bg-black text-white rounded shadow"
          onClick={() => setShowModal(true)}
        >
          + Record Journal Entry
        </button>
      </div>

      {showModal && (
        <JournalEntryModal
          entityId={entityId}
          eventTypes={eventTypes}
          onClose={() => setShowModal(false)}
        />
      )}

      {(eventsQuery.error || eventTypesQuery.error) && (
        <div className="text-red-600 text-sm">
          {eventsQuery.error && (
            <>
              Failed to load events:{" "}
              {String((eventsQuery.error as any)?.message ?? eventsQuery.error)}
            </>
          )}
          {eventTypesQuery.error && (
            <>
              <br />
              Failed to load event types:{" "}
              {String((eventTypesQuery.error as any)?.message ?? eventTypesQuery.error)}
            </>
          )}
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
                <td className="p-2 border-r">{ev.description}</td>
                <td className="p-2 border-r">{ev.event_type}</td>
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