"use client";

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
  const data = useDashboardData(warehouseId, Boolean(warehouseId));

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
