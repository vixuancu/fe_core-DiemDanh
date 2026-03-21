import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services';
import type { AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filter: AccountFilter) => [...accountKeys.lists(), filter] as const,
  stats: () => [...accountKeys.all, 'stats'] as const,
};

export function useAccounts(filter: AccountFilter) {
  return useQuery({
    queryKey: accountKeys.list(filter),
    queryFn: () => accountService.list(filter),
    retry: false,
  });
}

export function useAccountStats() {
  return useQuery({
    queryKey: accountKeys.stats(),
    queryFn: () => accountService.getStats(),
    retry: false,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAccountDto) => accountService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.stats() });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAccountDto }) =>
      accountService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.stats() });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.stats() });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => accountService.resetPassword(id),
  });
}
