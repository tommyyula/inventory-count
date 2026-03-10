export enum CountType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  CYCLE = 'CYCLE',
}

export enum CountDetailStatus {
  PENDING = 'PENDING',
  COUNTED = 'COUNTED',
  SKIPPED = 'SKIPPED',
  FLAGGED = 'FLAGGED',
}

export enum ScanMethod {
  BARCODE = 'BARCODE',
  MANUAL = 'MANUAL',
  PHOTO = 'PHOTO',
}

export enum Resolution {
  ACCEPTED = 'ACCEPTED',
  RECOUNT = 'RECOUNT',
  ADJUSTED = 'ADJUSTED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
}

export enum LocationType {
  RACK = 'RACK',
  FLOOR = 'FLOOR',
  BULK = 'BULK',
  STAGING = 'STAGING',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
}

export enum SnapshotStatus {
  CREATING = 'CREATING',
  READY = 'READY',
  EXPIRED = 'EXPIRED',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

export enum AIRecommendation {
  COMPLETE = 'COMPLETE',
  RECOUNT = 'RECOUNT',
  PARTIAL_RECOUNT = 'PARTIAL_RECOUNT',
}

export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}
