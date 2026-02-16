// src/hooks/useEconomicEvents.ts
import { useState } from "react";
import { EventOrchestrator } from "../orchestrators/EventOrchestrator";

export function useEconomicEvents() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recordEconomicEvent(params: {
    entityId: string;
    eventType: string;
    eventDate: string;
    description?: string;
    effects: any[];
  }): Promise<string> {
    setLoading(true);
    setError(null);

    try {
      return await EventOrchestrator.recordEconomicEvent(params);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    recordEconomicEvent,
    loading,
    error
  };
}
