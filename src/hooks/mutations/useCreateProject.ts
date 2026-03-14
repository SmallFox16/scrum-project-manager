import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '../../api/projects'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description: string }) => createProject(data),

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
