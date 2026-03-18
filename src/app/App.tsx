import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { AuthProvider } from '@/features/auth/context/AuthContext';

// ─── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry 1 lần khi lỗi, không chạy khi window focus (tiết kiệm request)
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
