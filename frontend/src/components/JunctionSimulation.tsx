import React from "react";
import './JunctionSimulation.css';
// Direction type and directions array for simulation
const directions = ['north', 'east', 'south', 'west'] as const;
type Direction = typeof directions[number];

const JunctionSimulation: React.FC<{ vehicleCounts: { [key: string]: number }, activeSignal: string }> = ({ vehicleCounts, activeSignal }) => {
  // For each direction, create an array of vehicle indices
  // Animate cars only when their signal is green
  const [carStates, setCarStates] = React.useState<{ [key in Direction]: number[] }>({ north: [], east: [], south: [], west: [] });

  // Sync car counts with vehicleCounts
  React.useEffect(() => {
    setCarStates(prev => {
      const next: { [key in Direction]: number[] } = { ...prev };
      directions.forEach(dir => {
        const count = vehicleCounts[dir] || 0;
        if (next[dir].length < count) {
          // Add new cars
          next[dir] = [...next[dir], ...Array(count - next[dir].length).fill(0).map((_, i) => Date.now() + i)];
        } else if (next[dir].length > count) {
          // Remove cars
          next[dir] = next[dir].slice(0, count);
        }
      });
      return next;
    });
  }, [vehicleCounts]);

  // When signal turns green, animate cars out
  React.useEffect(() => {
    if (!activeSignal) return;
    if (!carStates[activeSignal as Direction] || carStates[activeSignal as Direction].length === 0) return;
    // Animate cars out one by one
    let idx = 0;
    const interval = setInterval(() => {
      setCarStates(prev => {
        const arr = [...prev[activeSignal as Direction]];
        arr.shift();
        return { ...prev, [activeSignal]: arr };
      });
      idx++;
      if (idx >= (carStates[activeSignal as Direction]?.length || 0)) clearInterval(interval);
    }, 700);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [activeSignal]);

  return (
    <div className="junction-road-container">
      {/* North road */}
      <div className="junction-road junction-road-north">
        <div className={`junction-signal ${activeSignal === 'north' ? 'green' : 'red'}`}></div>
        {carStates['north'].map((id, i) => (
          <div key={id} className={`junction-car junction-car-north${activeSignal === 'north' ? ' moving' : ''}`} style={{ top: 30 + i * 22 }} />
        ))}
      </div>
      {/* South road */}
      <div className="junction-road junction-road-south">
        <div className={`junction-signal ${activeSignal === 'south' ? 'green' : 'red'}`}></div>
        {carStates['south'].map((id, i) => (
          <div key={id} className={`junction-car junction-car-south${activeSignal === 'south' ? ' moving' : ''}`} style={{ bottom: 30 + i * 22 }} />
        ))}
      </div>
      {/* East road */}
      <div className="junction-road junction-road-east">
        <div className={`junction-signal ${activeSignal === 'east' ? 'green' : 'red'}`}></div>
        {carStates['east'].map((id, i) => (
          <div key={id} className={`junction-car junction-car-east${activeSignal === 'east' ? ' moving' : ''}`} style={{ right: 30 + i * 22 }} />
        ))}
      </div>
      {/* West road */}
      <div className="junction-road junction-road-west">
        <div className={`junction-signal ${activeSignal === 'west' ? 'green' : 'red'}`}></div>
        {carStates['west'].map((id, i) => (
          <div key={id} className={`junction-car junction-car-west${activeSignal === 'west' ? ' moving' : ''}`} style={{ left: 30 + i * 22 }} />
        ))}
      </div>
      {/* Center intersection */}
      <div className="junction-center"></div>
    </div>
  );
};

export default JunctionSimulation;
