import type { LocationInfo } from '@domain/value-objects';
import { LocationType } from '@domain/enums';

export const mockLocations: LocationInfo[] = [
  { locationId: 'LOC-001', locationCode: 'A-01-01-01', zone: 'A', aisle: '01', rack: '01', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-002', locationCode: 'A-01-01-02', zone: 'A', aisle: '01', rack: '01', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-003', locationCode: 'A-01-02-01', zone: 'A', aisle: '01', rack: '02', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-004', locationCode: 'A-01-02-02', zone: 'A', aisle: '01', rack: '02', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-005', locationCode: 'A-02-01-01', zone: 'A', aisle: '02', rack: '01', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-006', locationCode: 'A-02-01-02', zone: 'A', aisle: '02', rack: '01', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-007', locationCode: 'A-02-02-01', zone: 'A', aisle: '02', rack: '02', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-008', locationCode: 'A-02-02-02', zone: 'A', aisle: '02', rack: '02', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-009', locationCode: 'A-03-01-01', zone: 'A', aisle: '03', rack: '01', level: '01', position: '01', locationType: LocationType.FLOOR, isActive: true },
  { locationId: 'LOC-010', locationCode: 'A-03-01-02', zone: 'A', aisle: '03', rack: '01', level: '02', position: '01', locationType: LocationType.FLOOR, isActive: true },
  { locationId: 'LOC-011', locationCode: 'B-01-01-01', zone: 'B', aisle: '01', rack: '01', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-012', locationCode: 'B-01-01-02', zone: 'B', aisle: '01', rack: '01', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-013', locationCode: 'B-01-02-01', zone: 'B', aisle: '01', rack: '02', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-014', locationCode: 'B-01-02-02', zone: 'B', aisle: '01', rack: '02', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-015', locationCode: 'B-02-01-01', zone: 'B', aisle: '02', rack: '01', level: '01', position: '01', locationType: LocationType.BULK, isActive: true },
  { locationId: 'LOC-016', locationCode: 'B-02-01-02', zone: 'B', aisle: '02', rack: '01', level: '02', position: '01', locationType: LocationType.BULK, isActive: true },
  { locationId: 'LOC-017', locationCode: 'B-02-02-01', zone: 'B', aisle: '02', rack: '02', level: '01', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-018', locationCode: 'B-02-02-02', zone: 'B', aisle: '02', rack: '02', level: '02', position: '01', locationType: LocationType.RACK, isActive: true },
  { locationId: 'LOC-019', locationCode: 'B-03-01-01', zone: 'B', aisle: '03', rack: '01', level: '01', position: '01', locationType: LocationType.STAGING, isActive: true },
  { locationId: 'LOC-020', locationCode: 'B-03-01-02', zone: 'B', aisle: '03', rack: '01', level: '02', position: '01', locationType: LocationType.STAGING, isActive: true },
];
