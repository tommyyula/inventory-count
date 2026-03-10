import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/plans', icon: <UnorderedListOutlined />, label: '盘点计划' },
    { key: '/plans/create', icon: <PlusOutlined />, label: '新建计划' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark">
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16 }}>
            📦 库存盘点系统
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <Typography.Text strong>仓库库存盘点管理系统</Typography.Text>
          <Typography.Text type="secondary">管理员</Typography.Text>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff', borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
