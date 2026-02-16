// src/hooks/useYearEnd.ts
import { useState } from "react";
import { YearEndOrchestrator } from "../orchestrators/YearEndOrchestrator";

export function useYearEnd() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    /**
     * RUN THE FULL YEAR-END CLOSE (Enterprise D-Suite)
     */
    runFullYearEndClose: async (entityId: string, year: number) => {
      try {
        setLoading(true);
        setError(null);

        return await YearEndOrchestrator.runFullYearEndClose(entityId, year);
      } catch (err: any) {
        console.error("runFullYearEndClose failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    /**
     * Generate opening balances
     */
    generateOpeningBalances: async (entityId: string, year: number) => {
      try {
        setLoading(true);
        setError(null);
        return await YearEndOrchestrator.generateOpeningBalances(entityId, year);
      } catch (err: any) {
        console.error("generateOpeningBalances failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    /**
     * Deferred tax posting (IAS 12)
     */
    postDeferredTax: async (entityId: string, year: number) => {
      try {
        setLoading(true);
        setError(null);
        return await YearEndOrchestrator.postDeferredTax(entityId, year);
      } catch (err: any) {
        console.error("postDeferredTax failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    /**
     * ECL posting (IFRS 9)
     */
    postECLMovement: async (entityId: string, year: number) => {
      try {
        setLoading(true);
        setError(null);
        return await YearEndOrchestrator.postECLMovement(entityId, year);
      } catch (err: any) {
        console.error("postECLMovement failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    /**
     * Generate cash flow (period-based)
     */
    generateCashFlow: async (entityId: string, periodId: string) => {
      try {
        setLoading(true);
        setError(null);
        return await YearEndOrchestrator.generateCashFlow(entityId, periodId);
      } catch (err: any) {
        console.error("generateCashFlow failed", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    loading,
    error
  };
}
