import type { User } from '@domain/value-objects';

export const mockUsers: User[] = [
  { userId: 'USR-001', username: 'admin', displayName: '管理员', role: 'ADMIN' },
  { userId: 'USR-002', username: 'operator1', displayName: '张三', role: 'OPERATOR' },
  { userId: 'USR-003', username: 'operator2', displayName: '李四', role: 'OPERATOR' },
  { userId: 'USR-004', username: 'operator3', displayName: '王五', role: 'OPERATOR' },
];
