"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Wallet, Users, Calendar } from "lucide-react";

type UserAnalytics = {
  username: string;
  name: string;
  totalLimit: number;
  spentAmount: number;
  availableAmount: number;
  periodSpent: number;
  periodPending: number;
  utilizationPercent: number;
};

type Analytics = {
  period: string;
  startDate: string | null;
  endDate: string | null;
  totals: {
    totalBudgetAllocated: number;
    totalSpent: number;
    totalAvailable: number;
    periodSpent: number;
    periodPending: number;
  };
  users: UserAnalytics[];
};

export default function BudgetAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      let url = `/api/budget/analytics?period=${period}`;
      if (period === "custom" && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomDateApply() {
    if (customStart && customEnd) {
      setPeriod("custom");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  const maxSpent = Math.max(...analytics.users.map((u) => u.periodSpent), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Analytics</h1>
        <p className="text-gray-600">Track budget utilization across your team</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPeriod("last_month")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === "last_month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setPeriod("this_month")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === "this_month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("this_year")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === "this_year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Year
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-600">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleCustomDateApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Budget"
          value={`₹${analytics.totals.totalBudgetAllocated.toLocaleString()}`}
          icon={<Wallet className="w-6 h-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Spent"
          value={`₹${analytics.totals.totalSpent.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-orange-500"
        />
        <StatCard
          title="Available"
          value={`₹${analytics.totals.totalAvailable.toLocaleString()}`}
          icon={<BarChart3 className="w-6 h-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Active Users"
          value={analytics.users.length.toString()}
          icon={<Users className="w-6 h-6" />}
          color="bg-purple-500"
        />
      </div>

      {/* User Spending Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">User-wise Spending</h2>

        <div className="space-y-4">
          {analytics.users.map((user) => (
            <div key={user.username} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ₹{user.periodSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.utilizationPercent.toFixed(1)}% utilized
                  </div>
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                {/* Total Limit Background */}
                <div className="absolute inset-0" />

                {/* Spent Amount */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{
                    width: `${(user.spentAmount / user.totalLimit) * 100}%`,
                  }}
                />

                {/* Period Spent (Candlestick style) */}
                <div
                  className="absolute top-0 left-0 h-full bg-orange-500 opacity-70"
                  style={{
                    width: `${(user.periodSpent / maxSpent) * 100}%`,
                  }}
                />

                {/* Labels inside bar */}
                <div className="absolute inset-0 flex items-center justify-between px-4 text-sm font-medium">
                  <span className="text-white drop-shadow">
                    Spent: ₹{user.spentAmount.toLocaleString()}
                  </span>
                  <span className="text-gray-700">
                    Limit: ₹{user.totalLimit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-gray-600">Total Spent: ₹{user.spentAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded" />
                  <span className="text-gray-600">Period: ₹{user.periodSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-gray-600">Available: ₹{user.availableAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Utilization Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Limit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Period Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.users.map((user) => (
                <tr key={user.username} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    ₹{user.totalLimit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-orange-600 font-medium">
                    ₹{user.spentAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                    ₹{user.availableAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600 font-medium">
                    ₹{user.periodSpent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.utilizationPercent > 80
                          ? "bg-red-100 text-red-800"
                          : user.utilizationPercent > 50
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.utilizationPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
