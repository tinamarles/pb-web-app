// components/ui-brand/DataTable.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TableConfig, SortConfig } from "@/lib/tableTypes";
import { Icon, Button, Checkbox } from "./index";

export interface DataTableProps<T> {
  /** Table configuration (from tableConfig.ts) */
  config: TableConfig<T>;

  /** Data array to display */
  data: T[];

  /** Loading state */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: string;
}

export function DataTable<T>({
  config,
  data,
  loading = false,
  emptyMessage = "No data to display",
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(),
  );
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================================
  // Selection Logic
  // ============================================================================

  const toggleRow = (rowId: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = filteredData.map((row) => config.getRowId(row));
      setSelectedRows(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // ============================================================================
  // Sorting Logic
  // ============================================================================

  const handleSort = (columnId: string) => {
    const column = config.columns.find((col) => col.id === columnId);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (!current || current.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { columnId, direction: "desc" };
      }
      return null; // Clear sort
    });
  };

  // ============================================================================
  // Search/Filter Logic
  // ============================================================================

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) => {
      // Search across all string/number fields
      return config.columns.some((col) => {
        if (!col.accessor) return false;
        const value = (row as any)[col.accessor];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, config.columns]);

  // ============================================================================
  // Sorted Data
  // ============================================================================

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const column = config.columns.find(
        (col) => col.id === sortConfig.columnId,
      );
      if (!column?.accessor) return 0;

      const aValue = (a as any)[column.accessor];
      const bValue = (b as any)[column.accessor];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig, config.columns]);

  // ============================================================================
  // Selected Row Data
  // ============================================================================

  const selectedRowData = useMemo(() => {
    return sortedData.filter((row) => selectedRows.has(config.getRowId(row)));
  }, [sortedData, selectedRows, config]);

  // ============================================================================
  // Bulk Action Handler
  // ============================================================================

  const handleBulkAction = (actionId: string) => {
    const action = config.bulkActions?.find((a) => a.id === actionId);
    if (!action) return;

    action.onClick(selectedRowData);
    clearSelection();
  };

  // ============================================================================
  // Row Action Handler
  // ============================================================================

  const handleRowAction = (actionId: string, row: T) => {
    const action = config.rowActions?.find((a) => a.id === actionId);
    if (!action?.onClick) return;

    action.onClick(row);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col gap-md">
      {/* Header Section */}
      <div className="dt-header">
        <div className="flex items-center gap-sm">
          <Icon name="list" className="text-primary" />
          <h2 className="title-lg text-primary">{config.label}</h2>
          <span className="title-lg text-on-surface-variant">
            - {filteredData.length} records
          </span>
        </div>

        {config.searchable && (
          <div className="dt-search input-field">
            <Icon name="search" />
            <input
              type="text"
              placeholder={config.searchPlaceholder || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base has-icon"
            />
          </div>
        )}
      </div>

      {/* Bulk Actions Bar (shown when rows selected) */}
      {selectedRows.size > 0 && config.bulkActions && (
        <div className="dt-bulk-actions">
          <div className="flex items-center gap-md">
            <Checkbox
              checked={selectedRows.size === filteredData.length}
              onChange={toggleAll}
            />
            <span className="label-lg">{selectedRows.size} selected</span>
          </div>

          <div className="flex items-center gap-md flex-wrap">
            {config.bulkActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || "default"}
                size="sm"
                onClick={() => handleBulkAction(action.id)}
              >
                {action.icon && <Icon name={action.icon} />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-outline-variant rounded-sm">
        <table className="w-full border-collapse bg-surface">
          {/* Table Header */}
          <thead className="bg-surface-container-low border-b border-b-outline-variant">
            <tr>
              {/* Selection Column */}
              {config.selectable && (
                <th className="dt-th dt-checkbox">
                  <Checkbox
                    checked={
                      selectedRows.size === filteredData.length &&
                      filteredData.length > 0
                    }
                    onChange={toggleAll}
                  />
                </th>
              )}

              {/* Data Columns */}
              {config.columns.map((column) => (
                <th
                  key={column.id}
                  className={`dt-th ${column.className || ""}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.sortable ? (
                    // <button
                    //   className="data-table-sort-button"
                    //   onClick={() => handleSort(column.id)}
                    // >
                    //   <span>{column.label}</span>
                    //   {sortConfig?.columnId === column.id && (
                    //     <Icon
                    //       name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
                    //       className="data-table-sort-icon"
                    //     />
                    //   )}
                    // </button>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => handleSort(column.id)}
                      label={column.label}
                      className="px-0 single-line-medium strong"
                      icon={
                        sortConfig?.columnId === column.id
                          ? sortConfig.direction === "asc"
                            ? "chevronup"
                            : "chevrondown"
                          : ""
                      }
                    />
                  ) : (
                    <span>{column.label}</span>
                  )}
                </th>
              ))}

              {/* Actions Column */}
              {config.rowActions && config.rowActions.length > 0 && (
                <th className="dt-th dt-th-actions">Actions</th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-surface">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    config.columns.length +
                    (config.selectable ? 1 : 0) +
                    (config.rowActions ? 1 : 0)
                  }
                >
                  <div className="flex flex-col items-center justify-center gap-md p-3xl body-md text-on-surface-variant">
                    <Icon name="loading" size="2xl" className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    config.columns.length +
                    (config.selectable ? 1 : 0) +
                    (config.rowActions ? 1 : 0)
                  }
                >
                  <div className="flex flex-col items-center justify-center gap-md p-3xl body-md text-on-surface-variant">
                    <Icon name="message" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const rowId = config.getRowId(row);
                const isSelected = selectedRows.has(rowId);

                return (
                  <tr
                    key={String(rowId)}
                    className={`dt-tr ${isSelected ? "bg-primary/20 hover:bg-primary/30" : ""}`}
                  >
                    {/* Selection Cell */}
                    {config.selectable && (
                      <td className="dt-td dt-checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(rowId)}
                        />
                      </td>
                    )}

                    {/* Data Cells */}
                    {config.columns.map((column) => (
                      <td
                        key={column.id}
                        className={`dt-td ${column.className || ""}`}
                      >
                        {column.render
                          ? column.render(row)
                          : column.accessor
                            ? String((row as any)[column.accessor] ?? "")
                            : ""}
                      </td>
                    ))}

                    {/* Actions Cell */}
                    {config.rowActions && config.rowActions.length > 0 && (
                      <td className="dt-td dt-td-actions">
                        <div className="flex items-center gap-xs justify-end">
                          {config.rowActions.map((action) => {
                            if (action.show && !action.show(row)) return null;

                            // Get href if it's a function or static string
                            const href =
                              typeof action.href === "function"
                                ? action.href(row)
                                : action.href;

                            // If href exists, render as Link
                            if (href) {

                              return (
                                
                                <Link key={action.id} href={href}>
                                  {action.icon && <Icon name={action.icon} className={`text-${action.variant}`}/>}
                                  {/* {action.label} */}
                                </Link>
                                
                              );
                            }

                            // Otherwise, render with onClick handler
                            return (
                              <Button
                                key={action.id}
                                variant='subtle'
                                size="md"
                                onClick={() => handleRowAction(action.id, row)}
                                className="px-0"
                              >
                                {action.icon && <Icon name={action.icon} className={`text-${action.variant}`}/>}
                                {/* {action.label} */}
                              </Button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
