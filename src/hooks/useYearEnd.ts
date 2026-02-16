import { useState, useCallback } from 'react'
import { YearEndOrchestrator } from '../orchestrators/YearEndOrchestrator'

export function useYearEnd() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runYearEnd = useCallback(async (entityId: string, year: number) => {
    setLoading(true)
    setError(null)

    try {
      const closeId = await YearEndOrchestrator.runFullYearEndClose(entityId, year)
      return closeId
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateOpeningBalances = useCallback(async (entityId: string, year: number) => {
    setLoading(true)
    setError(null)

    try {
      return await YearEndOrchestrator.generateOpeningBalances(entityId, year)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    runYearEnd,
    generateOpeningBalances,
    loading,
    error
  }
}
