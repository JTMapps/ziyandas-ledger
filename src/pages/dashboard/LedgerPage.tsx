import { useEconomicEvents } from "../../hooks/useEconomicEvents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

interface Props {
  entityId: string;
}

export default function LedgerPage({ entityId }: Props) {
  const { recordEconomicEvent } = useEconomicEvents();

  const { data: events, refetch } = useQuery({
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

  async function handleAddSample() {
    await recordEconomicEvent({
      entityId,
      eventType: "GENERAL_JOURNAL",
      eventDate: new Date().toISOString(),
      description: "Sample auto-generated event",
      effects: [
        { account_id: null, amount: 100, effect_sign: 1 },
        { account_id: null, amount: 100, effect_sign: -1 }
      ]
    });
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ledger / Economic Events</h2>
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={handleAddSample}
        >
          + Add Sample Event
        </button>
      </div>

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
