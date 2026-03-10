import { useEffect, useState, useRef } from 'react';
import { useCountTaskStore } from '@stores/countTaskStore';
import { CountDetailStatus, ScanMethod } from '@domain/enums';
import { useAuthStore } from '@stores/authStore';
import type { CountDetail } from '@domain/entities/CountDetail';

interface Props {
  locationId: string;
  taskId: string;
  isBlindCount: boolean;
  onBack: () => void;
}

export function LocationCount({ locationId, taskId, isBlindCount, onBack }: Props) {
  const { taskDetails, loadTaskDetails, updateDetail, skipDetail, flagDetail } = useCountTaskStore();
  const { currentUser } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qty, setQty] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [remark, setRemark] = useState('');
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTaskDetails(taskId);
  }, [taskId, loadTaskDetails]);

  const locationDetails = taskDetails.filter(d => d.locationId === locationId)
    .sort((a, b) => a.productCode.localeCompare(b.productCode));

  const pendingDetails = locationDetails.filter(d => d.status === CountDetailStatus.PENDING);
  const currentDetail = pendingDetails[currentIndex] || null;
  const doneCount = locationDetails.filter(d => d.status !== CountDetailStatus.PENDING).length;

  useEffect(() => {
    if (qtyRef.current) qtyRef.current.focus();
  }, [currentIndex, currentDetail]);

  const handleConfirm = async () => {
    if (!currentDetail) return;
    const countedQty = parseFloat(qty);
    if (isNaN(countedQty) || countedQty < 0) {
      alert('请输入有效数量');
      return;
    }

    // Large variance warning
    if (currentDetail.systemQty > 0) {
      const varPct = Math.abs((countedQty - currentDetail.systemQty) / currentDetail.systemQty * 100);
      if (varPct > 50) {
        if (!confirm(`差异较大(${varPct.toFixed(0)}%)，确认数量 ${countedQty} 吗？`)) return;
      }
    }

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate(50);

    await updateDetail(currentDetail.id, {
      countedQty,
      scanMethod: ScanMethod.MANUAL,
      remark: remark || undefined,
      countedBy: currentUser?.userId,
    });

    setQty('');
    setRemark('');
    setCurrentIndex(prev => Math.min(prev, pendingDetails.length - 2));
  };

  const handleSkip = async () => {
    if (!currentDetail) return;
    const reason = prompt('请输入跳过原因');
    if (!reason) return;
    await skipDetail(currentDetail.id, reason);
    setQty('');
  };

  const handleFlag = async () => {
    if (!currentDetail) return;
    const reason = prompt('请输入异常原因');
    if (!reason) return;
    const countedQty = qty ? parseFloat(qty) : undefined;
    await flagDetail(currentDetail.id, reason, countedQty);
    setQty('');
  };

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) return;
    const found = locationDetails.findIndex(d =>
      d.barcode === manualBarcode.trim() || d.productCode === manualBarcode.trim()
    );
    if (found >= 0) {
      const pendingIdx = pendingDetails.findIndex(d => d.id === locationDetails[found].id);
      if (pendingIdx >= 0) {
        setCurrentIndex(pendingIdx);
        setShowManual(false);
        setManualBarcode('');
      } else {
        alert('该商品已盘点完成');
      }
    } else {
      alert('未找到该商品');
    }
  };

  const locCode = locationDetails[0]?.locationCode || locationId;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', marginRight: 8 }}>←</button>
        <h2 style={{ margin: 0, fontSize: 18, flex: 1 }}>📦 {locCode}</h2>
        <span style={{ color: '#666' }}>{doneCount}/{locationDetails.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${locationDetails.length > 0 ? (doneCount / locationDetails.length * 100) : 0}%`, background: '#52c41a', borderRadius: 3 }} />
      </div>

      {currentDetail ? (
        <>
          {/* Manual search toggle */}
          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <button onClick={() => setShowManual(!showManual)}
              style={{ padding: '4px 12px', fontSize: 14, border: '1px solid #d9d9d9', borderRadius: 6, background: showManual ? '#e6f4ff' : '#fff', cursor: 'pointer' }}>
              {showManual ? '📷 扫码' : '⌨️ 手动'}
            </button>
          </div>

          {showManual && (
            <div style={{ background: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, display: 'flex', gap: 8 }}>
              <input
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="输入条码或编码"
                style={{ flex: 1, padding: 10, fontSize: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
              />
              <button onClick={handleManualSearch} style={{ padding: '10px 16px', fontSize: 16, background: '#1677ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                搜索
              </button>
            </div>
          )}

          {/* Product info */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{currentDetail.productName}</div>
            <div style={{ color: '#666', marginTop: 4 }}>编码: {currentDetail.productCode}</div>
            {currentDetail.barcode && <div style={{ color: '#666' }}>条码: {currentDetail.barcode}</div>}
            {!isBlindCount && <div style={{ color: '#1677ff', marginTop: 4 }}>系统数量: {currentDetail.systemQty} {currentDetail.uom}</div>}
          </div>

          {/* Quantity input */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#666' }}>实际数量 ({currentDetail.uom})</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setQty(String(Math.max(0, (parseFloat(qty) || 0) - 1)))}
                style={{ width: 56, height: 56, fontSize: 24, border: '2px solid #d9d9d9', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                −
              </button>
              <input
                ref={qtyRef}
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="0"
                style={{ flex: 1, padding: 12, fontSize: 28, textAlign: 'center', border: '2px solid #1677ff', borderRadius: 8, fontWeight: 'bold' }}
                inputMode="numeric"
              />
              <button onClick={() => setQty(String((parseFloat(qty) || 0) + 1))}
                style={{ width: 56, height: 56, fontSize: 24, border: '2px solid #d9d9d9', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
                +
              </button>
            </div>
          </div>

          {/* Remark */}
          <div style={{ marginBottom: 16 }}>
            <input
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="📝 备注（可选）"
              style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid #d9d9d9', borderRadius: 8, boxSizing: 'border-box' }}
            />
          </div>

          {/* Action buttons */}
          <button onClick={handleConfirm}
            style={{ width: '100%', padding: 16, fontSize: 18, fontWeight: 'bold', color: '#fff', background: '#52c41a', border: 'none', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
            ✅ 确认，下一个
          </button>
          <button onClick={handleFlag}
            style={{ width: '100%', padding: 14, fontSize: 16, color: '#fa8c16', background: '#fff', border: '2px solid #fa8c16', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
            ⚠️ 标记异常
          </button>
          <button onClick={handleSkip}
            style={{ width: '100%', padding: 14, fontSize: 16, color: '#999', background: '#fff', border: '2px solid #d9d9d9', borderRadius: 8, cursor: 'pointer' }}>
            ⏭ 跳过
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h3>该库位盘点完成！</h3>
          <p style={{ color: '#666' }}>共盘点 {doneCount} 项</p>
          <button onClick={onBack}
            style={{ padding: '12px 24px', fontSize: 16, color: '#fff', background: '#1677ff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            ← 返回库位列表
          </button>
        </div>
      )}

      {/* Done items list */}
      {doneCount > 0 && currentDetail && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 8 }}>已盘点 ({doneCount})</h4>
          {locationDetails.filter(d => d.status !== CountDetailStatus.PENDING).map(d => (
            <div key={d.id} style={{ background: '#f6ffed', borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span>{d.productCode} {d.productName}</span>
              <span style={{ fontWeight: 'bold' }}>{d.countedQty ?? '-'} {d.uom}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
