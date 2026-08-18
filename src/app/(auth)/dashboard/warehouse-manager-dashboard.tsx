"use client";

import { useMemo, useState } from "react";
import { EntityRef } from "@/lib/types/auth";
import {
  DashboardActivityPanels,
  DashboardError,
  ReportsFooterLink,
  SummaryMetricRow,
  useDashboardData,
  WarehouseContextHeader,
  WarehouseStructureMetrics,
} from "./dashboard-shared";
import {
  DashboardFilterBar,
  DashboardFilterState,
  resolveDateRange,
} from "@/components/dashboard/dashboard-filter-bar";

const initialFilterState: DashboardFilterState = {
  companyId: "",
  warehouseId: "",
  datePreset: "THIS_WEEK",
  customFromDate: "",
  customToDate: "",
  status: "ALL",
  operationType: "ALL",
};

export function WarehouseManagerDashboard({
  company,
  branch,
  warehouse,
}: {
  company?: EntityRef | null;
  branch?: EntityRef | null;
  warehouse?: EntityRef | null;
}) {
  const warehouseId = warehouse?.id;
  const [filterState, setFilterState] = useState<DashboardFilterState>(initialFilterState);

  const dateRange = useMemo(
    () => resolveDateRange(filterState.datePreset, filterState.customFromDate, filterState.customToDate),
    [filterState.datePreset, filterState.customFromDate, filterState.customToDate]
  );

  const data = useDashboardData({
    scopedWarehouseId: warehouseId,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    status: filterState.status !== "ALL" ? filterState.status : undefined,
    operationType: filterState.operationType !== "ALL" ? filterState.operationType : undefined,
    enabled: Boolean(warehouseId),
  });

  const handleFilterChange = (partial: Partial<DashboardFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilterState(initialFilterState);
  };

  if (data.summaryQuery.error) {
    return <DashboardError onRetry={() => data.summaryQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <WarehouseContextHeader
        warehouseName={warehouse?.name}
        warehouseCode={warehouse?.code}
        companyName={company?.name}
        branchName={branch?.name}
      />

      {/* Role-Scoped Filter Bar for Warehouse Admin */}
      <DashboardFilterBar
        role="WAREHOUSE_ADMIN"
        state={filterState}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        fixedCompanyName={company?.name || "Company"}
        fixedWarehouseName={warehouse?.name ? `${warehouse.name} (${warehouse.code || ''})` : "Assigned Warehouse"}
        isFetching={data.summaryQuery.isFetching || data.operationsQuery.isFetching}
      />

      <WarehouseStructureMetrics
        loading={data.roomsQuery.isLoading || data.occupancyQuery.isLoading}
        roomCount={data.roomCount}
        occupancyStats={data.occupancyStats}
        todayTotal={data.todayTotal}
      />

      <SummaryMetricRow
        summaryLoading={data.summaryQuery.isLoading}
        todayTotal={data.todayTotal}
        summary={data.summaryQuery.data}
        warehouseScoped
      />

      <DashboardActivityPanels
        warehouseScoped
        warehouseName={warehouse?.name}
        operationsByType={data.operationsByType}
        maxOperationCount={data.maxOperationCount}
        recentScans={data.scansQuery.data ?? []}
        scansLoading={data.scansQuery.isLoading}
        scansFetching={data.scansQuery.isFetching}
        operationsLoading={data.operationsQuery.isLoading}
      />

      <ReportsFooterLink warehouseScoped />
    </div>
  );
}
