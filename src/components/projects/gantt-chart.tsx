"use client";

import * as React from "react";
import {
  differenceInDays,
  format,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  max as dateMax,
  min as dateMin,
} from "date-fns";
import { cn } from "@/lib/utils";

export interface GanttTask {
  id: string;
  name: string;
  start: Date | null;
  end: Date | null;
  color?: string;
  progress?: number;
}

export interface GanttGroup {
  id: string;
  name: string;
  tasks: GanttTask[];
}

interface GanttChartProps {
  groups: GanttGroup[];
  startDate?: Date;
  endDate?: Date;
  showLegend?: boolean;
}

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Planning: { bg: "bg-blue-500/80", border: "border-blue-600", text: "text-blue-700" },
  Procurement: { bg: "bg-orange-500/80", border: "border-orange-600", text: "text-orange-700" },
  Shipping: { bg: "bg-purple-500/80", border: "border-purple-600", text: "text-purple-700" },
  Installation: { bg: "bg-green-500/80", border: "border-green-600", text: "text-green-700" },
  Commissioning: { bg: "bg-yellow-500/80", border: "border-yellow-600", text: "text-yellow-700" },
  Handover: { bg: "bg-red-500/80", border: "border-red-600", text: "text-red-700" },
};

function getPhaseColor(name: string) {
  for (const [phase, colors] of Object.entries(PHASE_COLORS)) {
    if (name.toLowerCase().includes(phase.toLowerCase())) {
      return colors;
    }
  }
  return { bg: "bg-zinc-500/80", border: "border-zinc-600", text: "text-zinc-700" };
}

const LABEL_WIDTH = 220;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 48;
const DAY_WIDTH = 3;

export function GanttChart({ groups, startDate, endDate, showLegend = true }: GanttChartProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Calculate timeline range from all tasks
  const allDates: Date[] = [];
  for (const group of groups) {
    for (const task of group.tasks) {
      if (task.start) allDates.push(task.start);
      if (task.end) allDates.push(task.end);
    }
  }

  if (allDates.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-zinc-200 p-12 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No timeline data available.
      </div>
    );
  }

  const timelineStart = startDate
    ? startOfMonth(startDate)
    : startOfMonth(dateMin(allDates));
  const timelineEnd = endDate
    ? endOfMonth(endDate)
    : endOfMonth(dateMax(allDates));

  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
  const timelineWidth = totalDays * DAY_WIDTH;

  const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });

  // Today marker position
  const today = new Date();
  const todayOffset = isWithinInterval(today, { start: timelineStart, end: timelineEnd })
    ? (differenceInDays(today, timelineStart) / totalDays) * 100
    : null;

  // Calculate total rows
  let totalRows = 0;
  for (const group of groups) {
    totalRows += 1; // group header
    totalRows += group.tasks.length;
  }

  return (
    <div className="space-y-3">
      {showLegend && (
        <div className="flex flex-wrap gap-4">
          {Object.entries(PHASE_COLORS).map(([phase, colors]) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div className={cn("h-3 w-6 rounded-sm", colors.bg)} />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">{phase}</span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="flex">
          {/* Fixed left column - project names */}
          <div
            className="shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
            style={{ width: LABEL_WIDTH }}
          >
            {/* Header spacer */}
            <div
              className="flex items-end border-b border-zinc-200 px-3 pb-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
              style={{ height: HEADER_HEIGHT }}
            >
              Project / Phase
            </div>

            {/* Rows */}
            {groups.map((group) => (
              <React.Fragment key={group.id}>
                {/* Group header */}
                <div
                  className="flex items-center border-b border-zinc-100 bg-zinc-100/50 px-3 text-xs font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200"
                  style={{ height: ROW_HEIGHT }}
                  title={group.name}
                >
                  <span className="truncate">{group.name}</span>
                </div>
                {/* Task rows */}
                {group.tasks.map((task) => {
                  const colors = getPhaseColor(task.name);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center border-b border-zinc-100 px-3 pl-6 text-xs dark:border-zinc-800"
                      style={{ height: ROW_HEIGHT }}
                      title={task.name}
                    >
                      <span className={cn("truncate", colors.text, "dark:opacity-80")}>
                        {task.name}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Scrollable timeline area */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto">
            <div style={{ width: Math.max(timelineWidth, 600), minWidth: "100%" }}>
              {/* Month headers */}
              <div
                className="relative flex border-b border-zinc-200 dark:border-zinc-800"
                style={{ height: HEADER_HEIGHT }}
              >
                {months.map((month) => {
                  const monthStart = dateMax([startOfMonth(month), timelineStart]);
                  const monthEnd = dateMin([endOfMonth(month), timelineEnd]);
                  const leftPct =
                    (differenceInDays(monthStart, timelineStart) / totalDays) * 100;
                  const widthPct =
                    ((differenceInDays(monthEnd, monthStart) + 1) / totalDays) * 100;

                  return (
                    <div
                      key={month.toISOString()}
                      className="absolute flex items-end border-r border-zinc-200 pb-1 pl-2 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        height: HEADER_HEIGHT,
                      }}
                    >
                      {format(month, "MMM yyyy")}
                    </div>
                  );
                })}
              </div>

              {/* Task bars */}
              <div className="relative">
                {/* Vertical month grid lines */}
                {months.map((month) => {
                  const monthStart = startOfMonth(month);
                  if (monthStart <= timelineStart) return null;
                  const leftPct =
                    (differenceInDays(monthStart, timelineStart) / totalDays) * 100;
                  return (
                    <div
                      key={`grid-${month.toISOString()}`}
                      className="absolute top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800"
                      style={{ left: `${leftPct}%` }}
                    />
                  );
                })}

                {/* Today marker */}
                {todayOffset !== null && (
                  <div
                    className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
                    style={{ left: `${todayOffset}%` }}
                    title={`Today: ${format(today, "dd MMM yyyy")}`}
                  >
                    <div className="absolute -top-0.5 -left-1 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Rows */}
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    {/* Group header row */}
                    <div
                      className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30"
                      style={{ height: ROW_HEIGHT }}
                    />
                    {/* Task bar rows */}
                    {group.tasks.map((task) => {
                      const colors = getPhaseColor(task.name);
                      let barLeft = 0;
                      let barWidth = 0;
                      let hasBar = false;

                      if (task.start && task.end) {
                        const taskStartClamped = dateMax([task.start, timelineStart]);
                        const taskEndClamped = dateMin([task.end, timelineEnd]);
                        barLeft =
                          (differenceInDays(taskStartClamped, timelineStart) / totalDays) *
                          100;
                        barWidth =
                          ((differenceInDays(taskEndClamped, taskStartClamped) + 1) /
                            totalDays) *
                          100;
                        hasBar = barWidth > 0;
                      }

                      return (
                        <div
                          key={task.id}
                          className="relative border-b border-zinc-100 dark:border-zinc-800"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {hasBar && (
                            <div
                              className={cn(
                                "absolute top-1.5 h-5 rounded-sm border",
                                colors.bg,
                                colors.border,
                                "transition-opacity hover:opacity-100",
                                "opacity-90"
                              )}
                              style={{
                                left: `${barLeft}%`,
                                width: `${Math.max(barWidth, 0.5)}%`,
                              }}
                              title={`${task.name}: ${task.start ? format(task.start, "dd MMM yyyy") : "?"} - ${task.end ? format(task.end, "dd MMM yyyy") : "?"}`}
                            >
                              {barWidth > 5 && (
                                <span className="absolute inset-0 flex items-center px-1 text-[10px] leading-none font-medium text-white truncate">
                                  {task.start && task.end
                                    ? `${format(task.start, "dd MMM")} - ${format(task.end, "dd MMM")}`
                                    : ""}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
