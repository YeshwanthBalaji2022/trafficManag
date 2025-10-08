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
 * Get signal status endpoint URL for API server
 */
export const getSignalStatusUrl = (junction: Junction): string => {
  // Map junction names to API server format
  const junctionMap: Record<Junction, string> = {
    'normal_01': '01_',
    'normal_02': '02_',
    'flipped_03': '05_',
    'flipped_04': 'rifatuslu_'
  };
  
  const apiJunction = junctionMap[junction] || junction;
  return `${API_BASE}/junction_signal_status?junction=${apiJunction}`;
};

/**
 * Get video stream URL for drone detection
 */
export const getVideoStreamUrl = (junction: Junction): string => {
  const droneJunction = DRONE_JUNCTION_MAP[junction];
  return `${DRONE_BASE}/drone/video_stream/${droneJunction}`;
};

/**
 * Update signal direction via API server
 */
export const updateSignalDirection = async (
  junction: Junction,
  direction: Direction
): Promise<void> => {
  try {
    // Map junction names to API server format
    const junctionMap: Record<Junction, string> = {
      'normal_01': '01_',
      'normal_02': '02_',
      'flipped_03': '05_',
      'flipped_04': 'rifatuslu_'
    };
    
    const apiJunction = junctionMap[junction] || junction;
    
    const response = await fetch(`${API_BASE}/junction_signal_status?junction=${apiJunction}&direction=${direction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update signal: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`Signal updated successfully: ${junction} -> ${direction}`, result);
  } catch (error) {
    console.error('Failed to update signal direction:', error);
    throw error;
  }
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