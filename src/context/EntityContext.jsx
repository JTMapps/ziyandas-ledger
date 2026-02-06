import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const EntityContext = createContext()

export function EntityProvider({ children, entityId = null }) {
  const [entities, setEntities] = useState([])
  const [entity, setEntity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntities()
  }, [entityId])

  async function loadEntities() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: true })

    if (!error && data.length > 0) {
      setEntities(data)
      
      // If entityId is provided, select that specific entity
      // Otherwise, default to first entity
      if (entityId) {
        const selectedEntity = data.find(e => e.id === entityId)
        setEntity(selectedEntity || data[0])
      } else {
        setEntity(prev => prev ?? data[0])
      }
    }

    setLoading(false)
  }

  function selectEntity(entityId) {
    const selected = entities.find(e => e.id === entityId)
    if (selected) {
      setEntity(selected)
    }
  }

  return (
    <EntityContext.Provider
      value={{
        entities,
        entity,
        setEntity: selectEntity,
        reloadEntities: loadEntities,
        loading,
      }}
    >
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (!context) {
    throw new Error('useEntity must be used within EntityProvider')
  }
  return context
}
