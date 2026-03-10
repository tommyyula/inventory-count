import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCountTaskStore } from '@stores/countTaskStore';
import { useAuthStore } from '@stores/authStore';
import { CountTaskStatus } from '@domain/enums/CountTaskStatus';
import { CountDetailStatus } from '@domain/enums';
import type { CountDetail } from '@domain/entities/CountDetail';
import { LocationCount } from './LocationCount';

export function CountExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTask, taskDetails, loadTask, loadTaskDetails, startTask, submitTask } = useCountTaskStore();
  const { currentUser } = useAuthStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/m/login'); return; }
    if (id) {
      loadTask(id);
      loadTaskDetails(id);
    }
  }, [id, currentUser, navigate, loadTask, loadTaskDetails]);

  if (!currentTask) return <div style={{ padding: 16, textAlign: 'center' }}>加载中...</div>;

  const handleStart = async () => {
    if (currentTask.status === CountTaskStatus.ASSIGNED || currentTask.status === CountTaskStatus.PAUSED) {
      await startTask(currentTask.id);
    }
  };

  const handleSubmit = async () => {
    const pending = taskDetails.filter(d => d.status === CountDetailStatus.PENDING);
    if (pending.length > 0) {
      alert(`还有 ${pending.length} 项未处理，请先完成所有库位的盘点`);
      return;
    }
    if (!confirm('确认提交盘点任务？提交后不可修改。')) return;
    setSubmitting(true);
    try {
      await submitTask(currentTask.id);
      alert('提交成功！');
      navigate('/m/tasks');
    } catch (err) {
      alert(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Group details by location
  const locationGroups = new Map<string, CountDetail[]>();
  for (const d of taskDetails) {
    if (!locationGroups.has(d.locationId)) locationGroups.set(d.locationId, []);
    locationGroups.get(d.locationId)!.push(d);
  }

  const locationEntries = [...locationGroups.entries()].sort((a, b) =>
    (a[1][0]?.locationCode || '').localeCompare(b[1][0]?.locationCode || '')
  );

  const totalItems = taskDetails.length;
  const doneItems = taskDetails.filter(d => d.status !== CountDetailStatus.PENDING).length;
  const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  if (selectedLocation) {
    return (
      <LocationCount
        locationId={selectedLocation}
        taskId={currentTask.id}
        isBlindCount={currentTask.isBlindCount}
        onBack={() => { setSelectedLocation(null); loadTaskDetails(currentTask.id); }}
      />
    );
  }

  const isActive = currentTask.status === CountTaskStatus.IN_PROGRESS;
  const canStart = currentTask.status === CountTaskStatus.ASSIGNED || currentTask.status === CountTaskStatus.PAUSED;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate('/m/tasks')} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', marginRight: 8 }}>←</button>
        <h2 style={{ margin: 0, fontSize: 18, flex: 1 }}>{currentTask.taskNo}</h2>
      </div>

      {/* Progress */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>进度: {doneItems}/{totalItems} 项</span>
          <span>{progressPct}%</span>
        </div>
        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: '#1677ff', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      {canStart && (
        <button onClick={handleStart}
          style={{ width: '100%', padding: 14, fontSize: 18, fontWeight: 'bold', color: '#fff', background: '#1677ff', border: 'none', borderRadius: 8, marginBottom: 16, cursor: 'pointer' }}>
          {currentTask.status === CountTaskStatus.PAUSED ? '恢复盘点' : '开始盘点'}
        </button>
      )}

      {/* Location list */}
      {locationEntries.map(([locId, details]) => {
        const locCode = details[0]?.locationCode || locId;
        const done = details.filter(d => d.status !== CountDetailStatus.PENDING).length;
        const total = details.length;
        const allDone = done === total;

        return (
          <div key={locId}
            onClick={() => isActive ? setSelectedLocation(locId) : undefined}
            style={{
              background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
              cursor: isActive ? 'pointer' : 'default',
              opacity: isActive ? 1 : 0.6,
              borderLeft: `4px solid ${allDone ? '#52c41a' : done > 0 ? '#faad14' : '#d9d9d9'}`,
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>📦 {locCode}</div>
                <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
                  {allDone ? '✅ 已完成' : done > 0 ? '🔄 进行中' : '⏳ 待盘点'} {done}/{total}
                </div>
              </div>
              {isActive && <span style={{ color: '#1677ff', fontSize: 14 }}>{allDone ? '查看' : '盘点'} →</span>}
            </div>
          </div>
        );
      })}

      {/* Submit button */}
      {isActive && (
        <button onClick={handleSubmit} disabled={submitting}
          style={{
            width: '100%', padding: 16, fontSize: 18, fontWeight: 'bold',
            color: '#fff', background: doneItems === totalItems ? '#52c41a' : '#d9d9d9',
            border: 'none', borderRadius: 8, marginTop: 16, cursor: doneItems === totalItems ? 'pointer' : 'not-allowed',
          }}>
          {submitting ? '提交中...' : `📋 提交任务 (${doneItems}/${totalItems})`}
        </button>
      )}
    </div>
  );
}
