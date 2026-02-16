import { useState, useCallback } from 'react'
import { EventOrchestrator } from '../orchestrators/EventOrchestrator'

export function useEconomicEvents() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  /** Record a journal entry (multi-effect economic event) */
  const recordEvent = useCallback(async (params: {
    entityId: string
    eventType: string
    eventDate: string
    description?: string
    effects: Array<{
      account_id: string
      amount: number
      effect_sign: 1 | -1
      tax_treatment?: string | null
      deductible?: boolean
    }>
  }) => {
    setLoading(true)
    setError(null)

    try {
      const id = await EventOrchestrator.recordEconomicEvent(params)
      return id
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { recordEvent, loading, error }
}
