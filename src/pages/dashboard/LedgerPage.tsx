import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import JournalEntryModal from "../../components/events/JournalEntryModal";
import { useEconomicEvents } from "../../hooks/useEconomicEvents";

type LedgerEventRow = {
  id: string;
  event_date: string;
  description: string | null;
  event_type: string | null;
  created_at: string;
};

export default function LedgerPage() {
  const { entityId } = useParams<{ entityId: string }>();

  if (!entityId) {
    return <div className="p-4">Missing entityId in route.</div>;
  }

  const { recordEconomicEvent, loading, error } = useEconomicEvents();
  const [showModal, setShowModal] = useState(false);

  const { data: events, refetch, isLoading } = useQuery<LedgerEventRow[]>({
    queryKey: ["economic-events", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events")
        .select(
          `
          id,
          event_date,
          description,
          event_type,
          created_at
        `
        )
        .eq("entity_id", entityId)
        .order("event_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as LedgerEventRow[];
    },
  });

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
          onClose={() => {
            setShowModal(false);
            refetch();
          }}
        />
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
            {isLoading && (
              <tr>
                <td className="p-4 text-center" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}

            {events?.map((ev) => (
              <tr key={ev.id} className="border-b hover:bg-gray-50">
                <td className="p-2 border-r">{ev.event_date}</td>
                <td className="p-2 border-r">{ev.description}</td>
                <td className="p-2 border-r">{ev.event_type}</td>
                <td className="p-2">{ev.created_at}</td>
              </tr>
            ))}

            {!isLoading && (events?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
