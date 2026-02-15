import { ARCHETYPES } from './archetypes'

export function getArchetypeLabel(value) {
  for (const group of Object.values(ARCHETYPES)) {
    const match = group.items.find(i => i.value === value)
    if (match) return match.label
  }
  return value
}
