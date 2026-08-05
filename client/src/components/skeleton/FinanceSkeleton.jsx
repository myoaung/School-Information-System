/**
 * FinanceSkeleton - Loading state for FinancePage and ParentPortalPage
 * Matches: overview cards, invoice table, payment details
 */

import { SkeletonText, SkeletonTextGroup } from './SkeletonText';
import { SkeletonStatCard } from './SkeletonCard';

export function FinanceSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <SkeletonText width="w-40" height="h-9" className="mb-2" />
          <SkeletonText width="w-64" height="h-4" />
        </div>
        <SkeletonText width="w-32" height="h-10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-purple-100/50 dark:bg-gray-800/50 rounded-xl p-1">
        {[1, 2, 3].map((i) => (
          <SkeletonText key={i} width="w-24" height="h-9" />
        ))}
      </div>

      {/* Overview Cards - Admin only */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Invoice List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <SkeletonText width="w-32" height="h-5" className="mb-4" />
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <SkeletonText width="w-24" height="h-4" />
                  <SkeletonText width="w-20" height="h-6" rounded="rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonText width="w-32" height="h-3" />
                  <SkeletonText width="w-24" height="h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Detail */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <SkeletonText width="w-40" height="h-5" className="mb-4" />
          <div className="space-y-4">
            <div className="flex justify-between">
              <SkeletonText width="w-32" height="h-4" />
              <SkeletonText width="w-24" height="h-4" />
            </div>
            <div className="flex justify-between">
              <SkeletonText width="w-28" height="h-4" />
              <SkeletonText width="w-20" height="h-4" />
            </div>
            <div className="flex justify-between">
              <SkeletonText width="w-36" height="h-4" />
              <SkeletonText width="w-16" height="h-4" />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <SkeletonText width="w-32" height="h-5" className="mb-2" />
              <SkeletonTextGroup lines={3} spacing="space-y-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParentFinanceSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Header Banner */}
      <div className="h-24 bg-purple-200 dark:bg-gray-700 rounded-2xl mb-6" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <SkeletonText key={i} width="w-24" height="h-10" />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
        <SkeletonTextGroup lines={4} spacing="space-y-4" />
      </div>
    </div>
  );
}
