import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services';
import type { AccountFilter, CreateAccountDto, UpdateAccountDto } from '../types';
import { notify } from '@/shared/lib/notify';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filter: AccountFilter) => [...accountKeys.lists(), filter] as const,
  stats: () => [...accountKeys.all, 'stats'] as const,
  roles: () => [...accountKeys.all, 'roles'] as const,
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

export function useAccountRoles() {
  return useQuery({
    queryKey: accountKeys.roles(),
    queryFn: () => accountService.getRoles(),
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
      notify.success('Tạo tài khoản thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Tạo tài khoản thất bại';
      notify.error(message);
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
      notify.success('Cập nhật tài khoản thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Cập nhật tài khoản thất bại';
      notify.error(message);
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
      notify.success('Đã khóa tài khoản thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Thao tác khóa tài khoản thất bại';
      notify.error(message);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => accountService.resetPassword(id),
    onSuccess: () => {
      notify.success('Đặt lại mật khẩu thành công');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại';
      notify.error(message);
    },
  });
}
