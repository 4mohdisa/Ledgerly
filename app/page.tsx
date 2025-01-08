import { MetricsCards } from "@/components/app/metrics-cards";
import { SpendingChart } from "@/components/app/charts/bar-chart-multiple";
import { PieDonutChart } from "@/components/app/charts/pie-donut-chart";
import { TransactionsTable } from "@/components/app/tables/transactions-table";
import { AppSidebar } from "@/components/app/app-sidebar";

export default function Dashboard() {
  return (
    <div className="flex">
      <div className="w-1/6">
        <AppSidebar />
      </div>
      <div className="w-5/6 p-8 space-y-8">
        <MetricsCards />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <SpendingChart />
          <PieDonutChart />
          {/* Placeholder for Balance Trends (Line Chart) */}
        </div>
        <TransactionsTable />
      </div>
    </div>
  );
}

// Add console log for debugging
console.log("Dashboard page rendered");