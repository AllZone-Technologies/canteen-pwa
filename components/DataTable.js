import React, { useState, useMemo } from "react";
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
}) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const columnHelper = createColumnHelper();

  const tableColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.type === "actions") {
        return columnHelper.display({
          id: col.id,
          header: col.header,
          cell: col.cell,
          enableSorting: false,
          size: col.size || 150,
        });
      }

      return columnHelper.accessor(col.accessorKey, {
        header: col.header,
        cell: col.cell || (({ getValue }) => getValue()),
        enableSorting: col.enableSorting !== false && sortable,
        size: col.size || 150,
      });
    });
  }, [columns, sortable]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting: sortable,
    enableGlobalFilter: searchable,
    enableRowSelection: false,
    initialState: {
      pagination: {
        pageSize,
      },
    },
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
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
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
                          {header.column.getIsSorted() === "asc" ? (
                            <FiChevronUp className={styles.sortIconActive} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <FiChevronDown className={styles.sortIconActive} />
                          ) : (
                            <div className={styles.sortIconPlaceholder}>
                              <FiChevronUp />
                              <FiChevronDown />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${styles.tableRow} ${
                    onRowClick ? styles.clickable : ""
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.tableCell}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className={styles.emptyState}
                >
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
