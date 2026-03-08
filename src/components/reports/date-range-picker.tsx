"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, startOfYear, endOfYear } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export function DateRangePicker({ from, to, onFromChange, onToChange }: DateRangePickerProps) {
  const presets = [
    {
      label: "This Month",
      apply: () => {
        const now = new Date();
        onFromChange(fmt(startOfMonth(now)));
        onToChange(fmt(endOfMonth(now)));
      },
    },
    {
      label: "Last Month",
      apply: () => {
        const prev = subMonths(new Date(), 1);
        onFromChange(fmt(startOfMonth(prev)));
        onToChange(fmt(endOfMonth(prev)));
      },
    },
    {
      label: "This Quarter",
      apply: () => {
        const now = new Date();
        onFromChange(fmt(startOfQuarter(now)));
        onToChange(fmt(now));
      },
    },
    {
      label: "This Year",
      apply: () => {
        const now = new Date();
        onFromChange(fmt(startOfYear(now)));
        onToChange(fmt(endOfYear(now)));
      },
    },
  ];

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs text-zinc-500">From</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-8 w-[140px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-zinc-500">To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-8 w-[140px]"
        />
      </div>
      {presets.map((p) => (
        <Button key={p.label} variant="outline" size="sm" onClick={p.apply}>
          {p.label}
        </Button>
      ))}
    </div>
  );
}
