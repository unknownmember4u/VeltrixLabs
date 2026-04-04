"use client";

import { useRobots } from "../lib/spacetime";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from "recharts";

export default function HeatMap() {
  const robots = useRobots();

  if (robots.length === 0) return null;

  // Map robots into coordinates for a heat map
  // Zone-A on top row (y=1), Zone-B on bottom row (y=0)
  const data = robots.map((robot) => {
    return {
      name: robot.name,
      x: robot.id <= 4 ? robot.id : robot.id - 4,
      y: robot.zone === "Zone-A" ? 1 : 0,
      vibration: Number(robot.vibration),
      temperature: Number(robot.temperature),
      status: robot.status,
    };
  });

  const getColor = (vibration, temp) => {
    if (vibration > 0.8 || temp > 85) return "#ef4444"; // red
    if (vibration > 0.6 || temp > 70) return "#f59e0b"; // amber
    return "#22c55e"; // green
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs">
          <p className="font-bold text-white mb-1">{data.name}</p>
          <p className="text-gray-400">Temp: <span className="text-white">{data.temperature.toFixed(1)}°C</span></p>
          <p className="text-gray-400">Vibration: <span className="text-white">{data.vibration.toFixed(2)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Factory Floor Heat Map
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">Real-time scatter projection</span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
            <XAxis type="number" dataKey="x" name="Position X" hide domain={[0, 5]} />
            <YAxis type="number" dataKey="y" name="Position Y" hide domain={[-0.5, 1.5]} />
            <ZAxis type="number" dataKey="vibration" range={[200, 800]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Robots" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.vibration, entry.temperature)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-xs text-gray-400">Normal</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-xs text-gray-400">Warning</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-xs text-gray-400">Critical</span></div>
      </div>
    </div>
  );
}
