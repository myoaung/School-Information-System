/**
 * DashboardSkeleton - Loading state for DashboardPage
 * Matches exact layout: stat cards, at-risk students, lifecycle, announcements, profile
 */

import { SkeletonText } from './SkeletonText';
import { SkeletonStatCard, SkeletonOverviewCard } from './SkeletonCard';
import { SkeletonAvatar } from './SkeletonAvatar';

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Page Title */}
      <div className="mb-8">
        <SkeletonText width="w-64" height="h-9" className="mb-2" />
        <SkeletonText width="w-32" height="h-4" />
      </div>

      {/* Stats Grid - 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* At-Risk Students Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <SkeletonText width="w-48" height="h-5" />
          </div>
          <div className="flex gap-2">
            <SkeletonText width="w-16" height="h-6" rounded="rounded-full" />
            <SkeletonText width="w-16" height="h-6" rounded="rounded-full" />
            <SkeletonText width="w-16" height="h-6" rounded="rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <SkeletonAvatar size="md" />
                <div className="space-y-2">
                  <SkeletonText width="w-32" height="h-4" />
                  <SkeletonText width="w-24" height="h-3" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SkeletonText width="w-16" height="h-5" rounded="rounded-full" />
                <SkeletonText width="w-16" height="h-5" rounded="rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifecycle Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <SkeletonText width="w-40" height="h-5" />
          </div>
          <SkeletonText width="w-20" height="h-4" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
              <SkeletonText width="w-8" height="h-6" className="mx-auto mb-2" />
              <SkeletonText width="w-12" height="h-3" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <SkeletonText width="w-48" height="h-5" />
          <SkeletonText width="w-20" height="h-4" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/50 rounded-xl">
              <SkeletonText width="w-3/4" height="h-4" className="mb-2" />
              <SkeletonText width="w-1/2" height="h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Profile, Quick Actions, Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <SkeletonOverviewCard />

        {/* Quick Actions */}
        <SkeletonOverviewCard />

        {/* Recent Activity */}
        <SkeletonOverviewCard />
      </div>
    </div>
  );
}
