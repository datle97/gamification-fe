import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Example service pattern
interface User {
  id: string
  name: string
  email: string
}

export const userService = {
  getAll: () => api.get('users').json<User[]>(),
  getById: (id: string) => api.get(`users/${id}`).json<User>(),
  create: (data: Omit<User, 'id'>) => api.post('users', { json: data }).json<User>(),
  update: (id: string, data: Partial<User>) => api.put(`users/${id}`, { json: data }).json<User>(),
  delete: (id: string) => api.delete(`users/${id}`),
}

// Example hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
