// Static team data used by components that need quick lookups
// without waiting for the /api/team fetch (e.g. task assignee display names).
// The full TeamMember objects (with email, avatarUrl, role) come from the API
// via useTeam() — see src/hooks/queries/useTeam.ts

export const TEAM_MEMBERS = [
  { id: 'tm-1', name: 'Marcus' },
  { id: 'tm-2', name: 'Alexander' },
  { id: 'tm-3', name: 'Robert' },
]
