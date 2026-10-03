// The one shared museum floor plan. Every position is x and y from 0 to 100 of the plan
// (x across, y down; the top of the plan is north). The plan is 800 x 560 drawing units, so
// 1 unit of x is 8 drawing units and 1 unit of y is 5.6.
//
// Every room name below is a name already used elsewhere in the app (data files and pages).
// Rooms, doors, sensor icons and dock bays are prototype-level: the flowchart does not
// define a floor plan.

export interface Point { x: number; y: number }

export interface PlanSensor { type: 'camera' | 'motion'; x: number; y: number; label: string }

export interface Room {
  id: string;
  name: string;
  x: number; y: number; w: number; h: number;
  kind: 'room' | 'corridor' | 'courtyard' | 'docks';
  /** where the label sits inside the room (default top) */
  labelAt?: 'top' | 'bottom' | 'vertical';
  sensors?: PlanSensor[];
}

export const PLAN_W = 800;
export const PLAN_H = 560;

// Outer perimeter fence (dashed) and the building outline
export const FENCE = { x: 2, y: 3, w: 96, h: 94 };
export const BUILDING = { x: 7, y: 9, w: 86, h: 80 };

export const ROOMS: Room[] = [
  { id: 'storage-wing-a', name: 'Storage Wing A', x: 7, y: 9, w: 23, h: 22, kind: 'room', labelAt: 'bottom' },
  { id: 'west-corridor', name: 'West Corridor', x: 30, y: 9, w: 5, h: 80, kind: 'corridor', labelAt: 'vertical' },
  { id: 'west-storage', name: 'West Storage', x: 7, y: 31, w: 23, h: 21, kind: 'room',
    sensors: [{ type: 'motion', x: 10, y: 49, label: 'Motion sensor' }] },
  { id: 'server-room-4', name: 'Server Room 4', x: 7, y: 52, w: 23, h: 20, kind: 'room' },
  { id: 'sector-4', name: 'Sector 4', x: 7, y: 72, w: 23, h: 17, kind: 'room' },
  { id: 'north-courtyard', name: 'North Courtyard', x: 35, y: 9, w: 26, h: 34, kind: 'courtyard',
    sensors: [{ type: 'camera', x: 37, y: 40, label: 'Camera' }, { type: 'camera', x: 58, y: 40, label: 'Camera' }] },
  { id: 'grand-gallery', name: 'Grand Gallery', x: 35, y: 43, w: 26, h: 46, kind: 'room',
    sensors: [{ type: 'camera', x: 38, y: 54, label: 'Camera' }, { type: 'camera', x: 58, y: 86, label: 'Camera' }] },
  { id: 'north-storage-wing', name: 'North Storage Wing', x: 61, y: 9, w: 32, h: 18, kind: 'room' },
  { id: 'storage-area-b', name: 'Storage Area B (North)', x: 61, y: 27, w: 32, h: 20, kind: 'room',
    sensors: [{ type: 'motion', x: 90, y: 31, label: 'Motion sensor B-12' }] },
  { id: 'east-wing', name: 'East Wing', x: 61, y: 47, w: 32, h: 18, kind: 'room',
    sensors: [{ type: 'camera', x: 90, y: 50, label: 'Camera' }] },
  { id: 'drone-docks', name: 'Drone Docks', x: 61, y: 65, w: 32, h: 24, kind: 'docks' }
];

export const getRoom = (name: string): Room => {
  const room = ROOMS.find(r => r.name === name);
  if (!room) throw new Error(`Unknown room: ${name}`);
  return room;
};

// Doorways: a gap in a wall. o = 'h' for a door in a horizontal wall, 'v' for a vertical wall.
export const DOORS: { x: number; y: number; o: 'h' | 'v'; len: number }[] = [
  { x: 30, y: 20, o: 'v', len: 6 }, { x: 30, y: 41, o: 'v', len: 6 }, { x: 30, y: 62, o: 'v', len: 6 }, { x: 30, y: 80, o: 'v', len: 6 },
  { x: 35, y: 26, o: 'v', len: 6 }, { x: 35, y: 66, o: 'v', len: 6 },
  { x: 48, y: 43, o: 'h', len: 8 }, { x: 48, y: 89, o: 'h', len: 8 },
  { x: 61, y: 18, o: 'v', len: 6 }, { x: 61, y: 57, o: 'v', len: 6 }, { x: 61, y: 78, o: 'v', len: 6 },
  { x: 77, y: 27, o: 'h', len: 8 }, { x: 77, y: 47, o: 'h', len: 8 }, { x: 77, y: 65, o: 'h', len: 8 }
];

// Main gate in the fence, south, in line with the Grand Gallery entrance
export const MAIN_GATE: Point = { x: 48, y: 97 };

// Charging dock bays (2 rows of 3) inside the Drone Docks room
export const DOCK_BAYS: Point[] = [
  { x: 66, y: 73 }, { x: 77, y: 73 }, { x: 89, y: 73 },
  { x: 70, y: 84 }, { x: 80, y: 84 }, { x: 90, y: 84 }
];

// Name of the place a position falls in, for labels. Outside the building but inside the fence
// it is the Perimeter Alpha strip.
export const placeAt = (x: number, y: number): string => {
  const room = ROOMS.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  return room ? room.name : 'Perimeter Alpha';
};
