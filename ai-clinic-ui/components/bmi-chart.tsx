"use client";

import { PatientVisitsRecord } from "@/drizzle/schemas/patient_visits";
import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const BMITrendChart = React.memo(function BMITrendChart({
  visits,
}: {
  visits: PatientVisitsRecord[];
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const chartData = useMemo(() => {
    return (visits || [])
      .filter((v) => v.bmi != null && v.visitDate != null)
      .map((v) => ({
        bmi: parseFloat(v.bmi!),
        timestamp: new Date(v.visitDate!).getTime(),
        dateStr: new Date(v.visitDate!).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [visits]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-32 bg-muted/20 rounded-xl flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          No BMI data available
        </span>
      </div>
    );
  }

  const currentBMI = chartData[chartData.length - 1].bmi;
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: "Underweight", color: "text-blue-600" };
    if (bmi >= 18.5 && bmi < 25)
      return { text: "Normal", color: "text-green-600" };
    if (bmi >= 25 && bmi < 30)
      return { text: "Overweight", color: "text-orange-500" };
    return { text: "Obese", color: "text-red-600" };
  };
  const category = getBMICategory(currentBMI);

  return (
    <div
      className={`
        relative bg-linear-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 
        border-2 rounded-xl overflow-hidden transition-[height,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isHovered ? "w-full h-48" : "w-full h-32"}
        shadow-md hover:shadow-xl border-slate-200/50 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-700
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header Information */}
      <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
        <div className="flex items-baseline gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Current BMI
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${category.color}`}>
                {currentBMI.toFixed(1)}
              </span>
              <span className={`text-sm font-medium ${category.color}`}>
                {category.text}
              </span>
            </div>
          </div>

          {/* Show data points count */}
          <div
            className={`flex flex-col items-center transition-[opacity,transform] duration-300 ${
              isHovered ? "opacity-100 scale-100" : "opacity-70 scale-95"
            }`}
          >
            <span className="text-[9px] font-bold text-muted-foreground uppercase">
              Data Points
            </span>
            <span className="text-lg font-bold text-muted-foreground">
              {chartData.length}
            </span>
          </div>
        </div>
      </div>

      {/* The Responsive Chart */}
      <div className="w-full h-full transition-opacity duration-300 pt-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: isHovered ? 25 : 10,
            }}
          >
            {/* Grid Lines (Only visible on hover) */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              opacity={isHovered ? 0.3 : 0}
              className="transition-opacity duration-300"
            />

            {/* The "Healthy Zone" Baseline (Fade in on hover) */}
            <ReferenceArea
              y1={18.5}
              y2={24.9}
              fill="#22c55e"
              fillOpacity={isHovered ? 0.15 : 0.08}
              ifOverflow="extendDomain"
              label={
                isHovered
                  ? {
                      value: "Healthy Range",
                      position: "insideTopRight",
                      fontSize: 10,
                      fill: "#22c55e",
                      fontWeight: 600,
                      opacity: 0.7,
                    }
                  : undefined
              }
            />

            {/* Axis */}
            <XAxis
              dataKey="dateStr"
              tick={{
                fontSize: 11,
                fill: "#64748b",
                fontWeight: 500,
                opacity: isHovered ? 1 : 0,
                style: { transition: "opacity 200ms ease" },
              }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{
                fontSize: 11,
                fill: "#64748b",
                fontWeight: 500,
                opacity: isHovered ? 1 : 0,
                style: { transition: "opacity 200ms ease" },
              }}
              axisLine={false}
              tickLine={false}
              width={35}
              dx={-5}
            />

            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ transition: "none" }}
              cursor={
                isHovered
                  ? {
                      stroke: "#94a3b8",
                      strokeWidth: 1.5,
                      strokeDasharray: "5 5",
                    }
                  : false
              }
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const bmi = payload[0].value as number;
                  const cat = getBMICategory(bmi);
                  return (
                    <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700 transition-none">
                      <div className="font-bold text-slate-300 mb-1">
                        {payload[0].payload.dateStr}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold">
                          {bmi.toFixed(1)}
                        </span>
                        <span
                          className={`text-xs ${cat.color.replace("text-", "text-opacity-90 ")}`}
                        >
                          {cat.text}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey="bmi"
              stroke={
                category.color.includes("red")
                  ? "#dc2626"
                  : category.color.includes("orange")
                    ? "#f97316"
                    : "#22c55e"
              }
              strokeWidth={isHovered ? 3 : 2}
              dot={
                isHovered
                  ? {
                      r: 4,
                      fill: "white",
                      stroke: category.color.includes("red")
                        ? "#dc2626"
                        : category.color.includes("orange")
                          ? "#f97316"
                          : "#22c55e",
                      strokeWidth: 2,
                    }
                  : {
                      r: 3,
                      fill: category.color.includes("red")
                        ? "#dc2626"
                        : category.color.includes("orange")
                          ? "#f97316"
                          : "#22c55e",
                      strokeWidth: 0,
                    }
              }
              activeDot={{
                r: 6,
                fill: category.color.includes("red")
                  ? "#dc2626"
                  : category.color.includes("orange")
                    ? "#f97316"
                    : "#22c55e",
                strokeWidth: 0,
                style: { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" },
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
