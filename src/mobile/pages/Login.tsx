import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

export function MobileLogin() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim());
      navigate('/m/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, paddingTop: 80, maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <h2 style={{ margin: 0, fontSize: 24 }}>仓库盘点系统</h2>
        <p style={{ color: '#999', marginTop: 8 }}>手持端</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="输入用户名（如 operator1）"
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 18,
            border: '2px solid #d9d9d9',
            borderRadius: 8,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
      </div>

      {error && (
        <div style={{ color: '#ff4d4f', marginBottom: 16, textAlign: 'center' }}>{error}</div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff',
          background: loading ? '#91caff' : '#1677ff',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '登录中...' : '登 录'}
      </button>

      <div style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 14 }}>
        <p>测试账号：operator1 / operator2 / operator3</p>
      </div>
    </div>
  );
}
