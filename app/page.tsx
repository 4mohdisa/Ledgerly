import { MetricsCards } from "@/components/app/metrics-cards";
import { SpendingChart } from "@/components/app/charts/spending-chart";
import { CategoryDistribution } from "@/components/app/charts/category-distribution";
import { TransactionsTable } from "@/components/app/tables/transactions-table";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <MetricsCards />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <SpendingChart />
        <CategoryDistribution />
        {/* Placeholder for Balance Trends (Line Chart) */}
      </div>
      <TransactionsTable />
    </div>
  );
}

// Add console log for debugging
console.log("Dashboard page rendered");