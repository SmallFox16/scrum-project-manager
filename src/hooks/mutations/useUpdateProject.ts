import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProject } from '../../api/projects'

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { status?: string }) => updateProject(projectId, data),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    },
  })
}
