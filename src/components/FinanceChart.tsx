"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  name: string;
  ingresos: number;
}

export default function FinanceChart({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#59dcc9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#59dcc9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#88b2b8", fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#88b2b8", fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#131c21", 
              border: "1px solid #23373d",
              borderRadius: "8px",
              color: "#fff"
            }}
            itemStyle={{ color: "#59dcc9" }}
            cursor={{ stroke: '#23373d', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke="#59dcc9"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorIngresos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
