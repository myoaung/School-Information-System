/**
 * TableSkeleton - Loading state for all list/table views
 * Matches StudentsPage, TeachersPage, ClassesPage table structure
 */

import { SkeletonText } from './SkeletonText';
import { SkeletonAvatar } from './SkeletonAvatar';

export function TableSkeleton({ columns = 7, rows = 5, hasAvatar = true, hasActions = true }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <SkeletonText width="w-48" height="h-9" />
        </div>
        <div className="flex gap-2">
          <SkeletonText width="w-28" height="h-10" />
          <SkeletonText width="w-32" height="h-10" />
          <SkeletonText width="w-64" height="h-10" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} scope="col" className="px-4 py-3 text-left font-medium">
                    <SkeletonText width="w-20" height="h-4" rounded="rounded-none" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                  {Array.from({ length: columns }).map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      {hasAvatar && colIdx === 0 ? (
                        <div className="flex items-center gap-3">
                          <SkeletonAvatar size="sm" />
                          <SkeletonText width="w-24" height="h-4" />
                        </div>
                      ) : hasActions && colIdx === columns - 1 ? (
                        <div className="flex items-center gap-2">
                          <SkeletonText width="w-12" height="h-6" />
                          <SkeletonText width="w-12" height="h-6" />
                        </div>
                      ) : (
                        <SkeletonText
                          width={colIdx === 0 ? 'w-20' : colIdx === columns - 1 ? 'w-16' : 'w-full'}
                          height="h-4"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between mt-4">
        <SkeletonText width="w-48" height="h-4" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <SkeletonText key={i} width="w-8" height="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}
