// API utility functions for traffic management system with drone detection

export type Junction = 'normal_01' | 'normal_02' | 'flipped_03' | 'flipped_04';
export type Direction = 'north' | 'east' | 'south' | 'west';

// Base URLs
const API_BASE = 'http://localhost:8000';
const DRONE_BASE = 'http://localhost:8002';

// Junction mapping for drone system (direct mapping now)
const DRONE_JUNCTION_MAP: Record<Junction, string> = {
  'normal_01': 'junction_01_normal',
  'normal_02': 'junction_02_normal', 
  'flipped_03': 'junction_03_flipped',
  'flipped_04': 'junction_04_flipped'
};

/**
 * Get vehicle count endpoint URL for drone detection
 */
export const getVehicleCountUrl = (
  direction: Direction,
  junction: Junction
): string => {
  const droneJunction = DRONE_JUNCTION_MAP[junction];
  return `${DRONE_BASE}/drone/junction_vehicle_count/${direction}?junction=${droneJunction}`;
};

/**
 * Get all vehicle counts for all directions at once (more efficient)
 * Uses the 'north' endpoint but extracts all_directions data
 */
export const getAllVehicleCountsUrl = (junction: Junction): string => {
  const droneJunction = DRONE_JUNCTION_MAP[junction];
  return `${DRONE_BASE}/drone/junction_vehicle_count/north?junction=${droneJunction}`;
};

/**
 * Get signal status endpoint URL for drone detection
 */
export const getSignalStatusUrl = (junction: Junction): string => {
  const droneJunction = DRONE_JUNCTION_MAP[junction];
  return `${DRONE_BASE}/drone/junction_signal_status?junction=${droneJunction}`;
};

/**
 * Get video stream URL for drone detection
 */
export const getVideoStreamUrl = (junction: Junction): string => {
  const droneJunction = DRONE_JUNCTION_MAP[junction];
  return `${DRONE_BASE}/drone/video_stream/${droneJunction}`;
};

/**
 * Update signal direction (currently simulated for drone system)
 */
export const updateSignalDirection = async (
  junction: Junction,
  direction: Direction
): Promise<void> => {
  // For drone system, signal control is currently simulated
  // Parameters are kept for API compatibility but not used
  console.warn('Signal control is simulated for drone system');
  console.log(`Simulated signal update: ${junction} -> ${direction}`);
  return Promise.resolve();
};

/**
 * Get available junctions for drone system
 */
export const getAvailableJunctions = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${DRONE_BASE}/drone/junctions`);
    const data = await response.json();
    return data.junctions || [];
  } catch (error) {
    console.error('Failed to fetch drone junctions:', error);
    return [];
  }
};

/**
 * Get system status for drone detection
 */
export const getSystemStatus = async (): Promise<any> => {
  try {
    const response = await fetch(`${DRONE_BASE}/`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get drone system status:', error);
    return { status: 'error', message: 'Drone system unavailable' };
  }
};

// Export base URLs for direct usage if needed
export { API_BASE, DRONE_BASE };