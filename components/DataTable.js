import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";
import styles from "../styles/DataTable.module.css";

const DataTable = ({
  data,
  columns,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  className = "",
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  onSort,
  sortBy,
}) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const columnHelper = createColumnHelper();

  const tableColumns = useMemo(() => {
    console.log("Processing columns:", columns);
    console.log("Sortable enabled:", sortable);

    const processedColumns = columns.map((col) => {
      console.log("Processing column:", col);
      console.log("Column type:", col.type);
      console.log("Column id:", col.id);
      console.log("Column accessorKey:", col.accessorKey);

      if (col.id === "actions" || col.type === "actions") {
        console.log("Processing actions column - disabling sorting");
        return columnHelper.display({
          id: col.id || "actions",
          header: col.header,
          cell: col.cell,
          enableSorting: false,
          size: col.size || 150,
        });
      }

      const processedColumn = columnHelper.accessor(col.accessorKey, {
        header: col.header,
        cell: col.cell || (({ getValue }) => getValue()),
        enableSorting: col.enableSorting !== false && sortable,
        size: col.size || 150,
      });

      console.log("Processed column:", processedColumn);
      console.log("Sorting enabled for column:", processedColumn.enableSorting);
      console.log("Column accessorKey:", processedColumn.accessorKey);

      return processedColumn;
    });

    console.log("Final processed columns:", processedColumns);
    return processedColumns;
  }, [columns, sortable, columnHelper]);

  // Handle sorting changes
  const handleSortingChange = (newSorting) => {
    console.log("DataTable sorting change - full object:", newSorting);
    console.log("DataTable sorting change - type:", typeof newSorting);
    console.log(
      "DataTable sorting change - length:",
      newSorting ? newSorting.length : "undefined"
    );
    console.log(
      "DataTable sorting change - first element:",
      newSorting && newSorting[0]
    );

    setSorting(newSorting);

    // Handle case where sorting is cleared (empty array)
    if (!newSorting || newSorting.length === 0) {
      console.log("Sorting cleared");
      return;
    }

    // Handle case where sorting is set
    if (onSort && newSorting[0] && newSorting[0].id) {
      const sortInfo = newSorting[0];
      console.log("Calling onSort with:", sortInfo.id);
      onSort(sortInfo.id); // Just pass the column name
    } else {
      console.log("Cannot call onSort - missing required data:", {
        hasOnSort: !!onSort,
        firstElement: newSorting[0],
        hasId: newSorting[0] && !!newSorting[0].id,
      });
    }
  };

  // Sync internal sorting state with external sortBy prop
  useEffect(() => {
    if (sortBy && sortBy.by) {
      console.log("Syncing sort state with:", sortBy);
      console.log("Current internal sorting before sync:", sorting);
      setSorting([
        {
          id: sortBy.by,
          desc: sortBy.order === "DESC",
        },
      ]);
      console.log("Setting new sorting state:", [
        {
          id: sortBy.by,
          desc: sortBy.order === "DESC",
        },
      ]);
    }
  }, [sortBy]);

  // Sort the data locally based on our custom sorting state
  const sortedData = useMemo(() => {
    if (!sorting || sorting.length === 0) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      for (const sortInfo of sorting) {
        const { id, desc } = sortInfo;
        const aValue = a[id];
        const bValue = b[id];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return desc ? 1 : -1;
        if (bValue == null) return desc ? -1 : 1;

        // Handle different data types
        let comparison = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        } else {
          // Convert to string for comparison
          comparison = String(aValue).localeCompare(String(bValue));
        }

        if (comparison !== 0) {
          return desc ? -comparison : comparison;
        }
      }
      return 0;
    });

    console.log("Data sorted locally:", {
      original: data.length,
      sorted: sorted.length,
      sorting,
    });
    return sorted;
  }, [data, sorting]);

  const table = useReactTable({
    data: sortedData, // Use sortedData for the table
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      ...(pagination && {
        pagination: {
          pageIndex: 0,
          pageSize,
        },
      }),
    },
    onSortingChange: handleSortingChange,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pagination && { getPaginationRowModel: getPaginationRowModel() }),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting: sortable,
    enableGlobalFilter: searchable,
    enableRowSelection: false,
    enablePagination: pagination,
    ...(pagination && {
      initialState: {
        pagination: {
          pageSize,
        },
      },
    }),
  });

  // Debug table setup
  if (table && table.getHeaderGroups) {
    console.log("Table setup debug:", {
      enableSorting: sortable,
      tableEnableSorting: table.options.enableSorting,
      columnsWithSorting: tableColumns.filter((col) => col.enableSorting),
      sortingEnabled: sortable,
      headerGroups: table.getHeaderGroups().map((group) =>
        group.headers.map((header) => ({
          id: header.id,
          accessorKey: header.column.accessorKey,
          canSort: header.column.getCanSort(),
          hasToggleHandler: !!header.column.getToggleSortingHandler,
        }))
      ),
    });
  } else {
    console.error("Table not properly initialized");
  }

  console.log("Table configuration:", {
    enableSorting: sortable,
    sorting,
    sortingDetails: sorting.map((s) => ({ id: s.id, desc: s.desc })),
    columns: tableColumns,
    canSort: tableColumns.some((col) => col.enableSorting),
    coreRows: table.getCoreRowModel().rows.length,
  });

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.tableContainer} ${className}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className={styles.clearSearch}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className={styles.tableHeaderRow}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={styles.tableHeader}
                    style={{ width: header.getSize() }}
                    onClick={
                      header.column &&
                      header.column.getCanSort &&
                      header.column.getCanSort()
                        ? () => {
                            console.log("Header clicked:", header.id);
                            console.log(
                              "Can sort:",
                              header.column.getCanSort()
                            );
                            console.log("Current sorting:", sorting);

                            // Use our custom sorting implementation directly
                            console.log(
                              "Using custom sorting for column:",
                              header.column.accessorKey
                            );

                            // Determine new sorting state
                            const currentSort = sorting.find(
                              (s) => s.id === header.column.accessorKey
                            );

                            let newSorting;
                            if (currentSort) {
                              if (currentSort.desc) {
                                // Currently DESC, remove sorting
                                newSorting = sorting.filter(
                                  (s) => s.id !== header.column.accessorKey
                                );
                              } else {
                                // Currently ASC, change to DESC
                                newSorting = sorting.map((s) =>
                                  s.id === header.column.accessorKey
                                    ? { ...s, desc: true }
                                    : s
                                );
                              }
                            } else {
                              // No current sorting, add ASC
                              newSorting = [
                                ...sorting,
                                { id: header.column.accessorKey, desc: false },
                              ];
                            }

                            console.log("New sorting state:", newSorting);
                            console.log(
                              "Calling handleSortingChange with:",
                              newSorting
                            );
                            handleSortingChange(newSorting);
                            console.log(
                              "Sorting state updated, current sorting:",
                              sorting
                            );
                          }
                        : undefined
                    }
                  >
                    <div className={styles.headerContent}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <div className={styles.sortIcon}>
                          {(() => {
                            const currentSort = sorting.find(
                              (s) => s.id === header.column.accessorKey
                            );
                            if (currentSort) {
                              return currentSort.desc ? (
                                <FiChevronDown
                                  className={styles.sortIconActive}
                                />
                              ) : (
                                <FiChevronUp
                                  className={styles.sortIconActive}
                                />
                              );
                            } else {
                              return (
                                <div className={styles.sortIconPlaceholder}>
                                  <FiChevronUp />
                                  <FiChevronDown />
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {sortedData.length > 0 ? (
              sortedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`${styles.tableRow} ${
                    onRowClick ? styles.clickable : ""
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {tableColumns.map((column) => {
                    if (column.id === "actions" || column.type === "actions") {
                      return (
                        <td key="actions" className={styles.tableCell}>
                          {column.cell &&
                            column.cell({ row: { original: row } })}
                        </td>
                      );
                    }
                    return (
                      <td key={column.accessorKey} className={styles.tableCell}>
                        {row[column.accessorKey]}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <div className={styles.emptyIcon}>📊</div>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && table.getPageCount() > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            <span>
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          </div>

          <div className={styles.paginationControls}>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={styles.paginationButton}
            >
              <FiChevronLeft />
              Previous
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                .filter((page) => {
                  const current = table.getState().pagination.pageIndex + 1;
                  return (
                    page === 1 ||
                    page === table.getPageCount() ||
                    (page >= current - 1 && page <= current + 1)
                  );
                })
                .map((page, index, array) => {
                  if (index > 0 && array[index - 1] !== page - 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <span className={styles.pageEllipsis}>...</span>
                        <button
                          onClick={() => table.setPageIndex(page - 1)}
                          className={`${styles.pageButton} ${
                            table.getState().pagination.pageIndex + 1 === page
                              ? styles.pageButtonActive
                              : ""
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => table.setPageIndex(page - 1)}
                      className={`${styles.pageButton} ${
                        table.getState().pagination.pageIndex + 1 === page
                          ? styles.pageButtonActive
                          : ""
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={styles.paginationButton}
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
