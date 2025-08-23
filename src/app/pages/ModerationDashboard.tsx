import { useState } from 'react'
import { PermissionGate } from '@shared/components/PermissionGate'
import { ModerationQueue } from '@features/moderation/components/ModerationQueue'
import { ModerationStats } from '@features/moderation/components/ModerationStats'
import type { ModerationFilter } from '@features/moderation/types/moderation.types'

/**
 * Main moderation dashboard page for moderators and admins
 */
export function ModerationDashboard() {
  const [filter, setFilter] = useState<ModerationFilter>({
    status: 'pending',
    contentType: 'all',
    reportedOnly: false
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const handleFilterChange = (newFilter: Partial<ModerationFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
    // Clear selection when filter changes
    setSelectedItems([])
  }

  return (
    <PermissionGate 
      requiredPermission="moderate"
      fallback={
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              You don't have permission to access the moderation dashboard.
            </p>
          </div>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Content Moderation
          </h1>
          <p className="text-muted-foreground">
            Review and moderate user-submitted content to maintain quality standards.
          </p>
        </div>

        {/* Statistics Overview */}
        <ModerationStats />

        {/* Filter Controls */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Filter Options
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                id="status-filter"
                value={filter.status || 'all'}
                onChange={(e) => handleFilterChange({ status: e.target.value as ModerationFilter['status'] })}
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="flagged">Flagged</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            {/* Content Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-foreground mb-2">
                Content Type
              </label>
              <select
                id="type-filter"
                value={filter.contentType || 'all'}
                onChange={(e) => handleFilterChange({ contentType: e.target.value as ModerationFilter['contentType'] })}
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Types</option>
                <option value="song">Songs</option>
                <option value="arrangement">Arrangements</option>
              </select>
            </div>
            
            {/* Reported Only Toggle */}
            <div>
              <label htmlFor="reported-filter" className="block text-sm font-medium text-foreground mb-2">
                Show Only
              </label>
              <label className="flex items-center">
                <input
                  id="reported-filter"
                  type="checkbox"
                  checked={filter.reportedOnly || false}
                  onChange={(e) => handleFilterChange({ reportedOnly: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span className="ml-2 text-sm text-foreground">Reported content only</span>
              </label>
            </div>

            {/* Search Filter */}
            <div>
              <label htmlFor="search-filter" className="block text-sm font-medium text-foreground mb-2">
                Search
              </label>
              <input
                id="search-filter"
                type="text"
                placeholder="Search titles or creators..."
                value={filter.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Moderation Queue */}
        <ModerationQueue
          filter={filter}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      </div>
    </PermissionGate>
  )
}