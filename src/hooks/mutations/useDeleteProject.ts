import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteProject } from '../../api/projects'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
