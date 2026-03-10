import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { AdminLayout } from '@web/layouts/AdminLayout';
import { MobileLayout } from '@mobile/layouts/MobileLayout';
import { Dashboard } from '@web/pages/Dashboard';
import { PlanList } from '@web/pages/PlanList';
import { PlanCreate } from '@web/pages/PlanCreate';
import { PlanDetail } from '@web/pages/PlanDetail';
import { MobileLogin } from '@mobile/pages/Login';
import { MobileTaskList } from '@mobile/pages/TaskList';
import { CountExecution } from '@mobile/pages/CountExecution';
import { useEffect } from 'react';
import { useAuthStore } from '@stores/authStore';

function App() {
  const loadUser = useAuthStore(s => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <ErrorBoundary>
        <BrowserRouter basename="/inventory-count">
          <Routes>
            {/* Web Admin routes */}
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/plans" element={<PlanList />} />
              <Route path="/plans/create" element={<PlanCreate />} />
              <Route path="/plans/:id" element={<PlanDetail />} />
            </Route>

            {/* Mobile PWA routes */}
            <Route path="/m" element={<MobileLayout />}>
              <Route path="login" element={<MobileLogin />} />
              <Route path="tasks" element={<MobileTaskList />} />
              <Route path="tasks/:id" element={<CountExecution />} />
            </Route>

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;
