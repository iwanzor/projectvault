"use client";

import * as React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface WarehouseLineItem {
  barcode: string;
  serialNo: string;
  model: string;
  itemDescription: string;
  location: string;
  quantity: number;
  unit: string;
}

interface WarehouseLineItemsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  fieldName: string;
  readOnly?: boolean;
}

export function WarehouseLineItems({
  form,
  fieldName,
  readOnly = false,
}: WarehouseLineItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldName,
  });

  const watchItems = form.watch(fieldName);

  function handleAddItem() {
    append({
      barcode: "",
      serialNo: "",
      model: "",
      itemDescription: "",
      location: "",
      quantity: 1,
      unit: "PCS",
    });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          {!readOnly && (
            <Button type="button" size="sm" onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed rounded-md">
            No items added yet. Click &quot;Add Item&quot; to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left p-2 w-10">#</th>
                  <th className="text-left p-2 w-[140px]">Barcode</th>
                  <th className="text-left p-2 w-[130px]">Serial No</th>
                  <th className="text-left p-2 w-[120px]">Model</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2 w-[100px]">Location</th>
                  <th className="text-right p-2 w-[80px]">Qty</th>
                  <th className="text-left p-2 w-[80px]">Unit</th>
                  {!readOnly && <th className="text-center p-2 w-[50px]"></th>}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr
                    key={field.id}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <td className="p-2 text-zinc-400">{index + 1}</td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm">{watchItems?.[index]?.barcode ?? "-"}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Barcode"
                          {...form.register(`${fieldName}.${index}.barcode`)}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm">{watchItems?.[index]?.serialNo ?? "-"}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Serial No"
                          {...form.register(`${fieldName}.${index}.serialNo`)}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm">{watchItems?.[index]?.model ?? "-"}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Model"
                          {...form.register(`${fieldName}.${index}.model`)}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm">{watchItems?.[index]?.itemDescription ?? "-"}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Description"
                          {...form.register(`${fieldName}.${index}.itemDescription`)}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm">{watchItems?.[index]?.location ?? "-"}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Location"
                          {...form.register(`${fieldName}.${index}.location`)}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm text-right block">{watchItems?.[index]?.quantity ?? 0}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs text-right"
                          type="number"
                          min="1"
                          {...form.register(`${fieldName}.${index}.quantity`)}
                        />
                      )}
                    </td>
                    <td className="p-2">
                      {readOnly ? (
                        <span className="text-sm">{watchItems?.[index]?.unit ?? "-"}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Unit"
                          {...form.register(`${fieldName}.${index}.unit`)}
                        />
                      )}
                    </td>
                    {!readOnly && (
                      <td className="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
