import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useCountTaskStore } from '@stores/countTaskStore';
import { CountTaskStatus } from '@domain/enums/CountTaskStatus';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  [CountTaskStatus.ASSIGNED]: { label: '待执行', color: '#1677ff', bg: '#e6f4ff' },
  [CountTaskStatus.IN_PROGRESS]: { label: '进行中', color: '#fa8c16', bg: '#fff7e6' },
  [CountTaskStatus.PAUSED]: { label: '已暂停', color: '#faad14', bg: '#fffbe6' },
  [CountTaskStatus.SUBMITTED]: { label: '已提交', color: '#52c41a', bg: '#f6ffed' },
  [CountTaskStatus.PENDING]: { label: '待分配', color: '#999', bg: '#f5f5f5' },
};

export function MobileTaskList() {
  const { currentUser, logout } = useAuthStore();
  const { tasks, loadMyTasks, isLoading } = useCountTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/m/login');
      return;
    }
    loadMyTasks(currentUser.userId);
  }, [currentUser, loadMyTasks, navigate]);

  const activeTasks = tasks.filter(t =>
    [CountTaskStatus.ASSIGNED, CountTaskStatus.IN_PROGRESS, CountTaskStatus.PAUSED].includes(t.status)
  );
  const doneTasks = tasks.filter(t => t.status === CountTaskStatus.SUBMITTED);

  const handleLogout = async () => {
    await logout();
    navigate('/m/login');
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>
          👋 {currentUser?.displayName || '操作员'}
        </h2>
        <button onClick={handleLogout} style={{ padding: '6px 12px', fontSize: 14, border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
          退出
        </button>
      </div>

      {isLoading && <p style={{ textAlign: 'center', color: '#999' }}>加载中...</p>}

      <h3 style={{ fontSize: 16, marginBottom: 12 }}>待执行 ({activeTasks.length})</h3>
      {activeTasks.length === 0 && <p style={{ color: '#999' }}>暂无待执行任务</p>}
      {activeTasks.map(task => {
        const st = statusLabels[task.status] || { label: task.status, color: '#000', bg: '#f5f5f5' };
        return (
          <div key={task.id} onClick={() => navigate(`/m/tasks/${task.id}`)}
            style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>{task.taskNo}</strong>
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
              <div>库位数: {task.locationIds.length} | 轮次: {task.round}</div>
            </div>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <span style={{ color: '#1677ff', fontSize: 14 }}>
                {task.status === CountTaskStatus.IN_PROGRESS ? '继续盘点 →' : task.status === CountTaskStatus.PAUSED ? '恢复盘点 →' : '开始盘点 →'}
              </span>
            </div>
          </div>
        );
      })}

      {doneTasks.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, marginBottom: 12, marginTop: 24 }}>已完成 ({doneTasks.length})</h3>
          {doneTasks.map(task => (
            <div key={task.id} style={{ background: '#f6ffed', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{task.taskNo}</strong>
                <span style={{ color: '#52c41a', fontSize: 12 }}>✅ 已提交</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
