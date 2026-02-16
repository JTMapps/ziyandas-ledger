import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import JournalEntryModal from "../../components/events/JournalEntryModal"; 
import { useEconomicEvents } from "../../hooks/useEconomicEvents";

interface Props {
  entityId: string;
}

export default function LedgerPage({ entityId }: Props) {
  const { recordEconomicEvent } = useEconomicEvents();   // <-- Correct method name
  const [showModal, setShowModal] = useState(false);

  // ---------------------------
  // LOAD ECONOMIC EVENTS
  // ---------------------------
  const { data: events, refetch, isLoading } = useQuery({
    queryKey: ["events", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("economic_events")
        .select("id, event_date, description, event_type, created_at")
        .eq("entity_id", entityId)
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ledger / Economic Events</h2>

        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => setShowModal(true)}
        >
          + Record Journal Entry
        </button>
      </div>

      {/* JOURNAL ENTRY MODAL */}
      {showModal && (
        <JournalEntryModal
          entityId={entityId}
          onClose={() => {
            setShowModal(false);
            refetch();       // Refresh ledger after posting
          }}
        />
      )}

      {/* EVENTS TABLE */}
      <table className="min-w-full border rounded bg-white shadow-sm">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Created</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4} className="text-center p-4">
                Loading…
              </td>
            </tr>
          )}

          {events?.map((ev: any) => (
            <tr key={ev.id} className="text-sm">
              <td className="border p-2">{ev.event_date}</td>
              <td className="border p-2">{ev.description}</td>
              <td className="border p-2">{ev.event_type}</td>
              <td className="border p-2">{ev.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
