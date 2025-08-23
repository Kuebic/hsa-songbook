import { useState, useMemo } from 'react'
import { useUsers } from '../hooks/useUsers'
import { useRoleManagement } from '../hooks/useRoleManagement'
import { RoleAssignmentModal } from './RoleAssignmentModal'
import type { UserWithRole, UserFilter, RoleAssignment } from '../types/admin.types'
import styles from './UserList.module.css'

export function UserList() {
  const [filter, setFilter] = useState<UserFilter>({ page: 1, limit: 20 })
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { data, isLoading, error } = useUsers(filter)
  const { assignRole, isAssigning } = useRoleManagement()

  const handleRoleChange = (user: UserWithRole) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleAssignRole = async (assignment: RoleAssignment) => {
    try {
      await assignRole(assignment)
      setIsModalOpen(false)
      // Success notification would be handled by notification system
    } catch (error) {
      console.error('Failed to assign role:', error)
      // Error handled in hook and notification system
    }
  }

  const totalPages = useMemo(() => {
    if (!data?.total || !filter.limit) return 1
    return Math.ceil(data.total / filter.limit)
  }, [data?.total, filter.limit])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, search: e.target.value, page: 1 })
  }

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, role: e.target.value as UserFilter['role'], page: 1 })
  }

  const handleSortChange = (sortBy: UserFilter['sortBy']) => {
    setFilter({
      ...filter,
      sortBy,
      sortOrder: filter.sortBy === sortBy && filter.sortOrder === 'asc' ? 'desc' : 'asc'
    })
  }

  const handlePageChange = (page: number) => {
    setFilter({ ...filter, page })
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading users...</div>
  }

  if (error) {
    return <div className={styles.error}>Error loading users: {error.message}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>User Management</h2>
        <div className={styles.stats}>
          <span>{data?.total || 0} total users</span>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by email or name..."
          onChange={handleSearchChange}
          className={styles.searchInput}
          value={filter.search || ''}
        />
        <select
          onChange={handleRoleFilterChange}
          className={styles.roleFilter}
          value={filter.role || 'all'}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="moderator">Moderators</option>
          <option value="user">Regular Users</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSortChange('email')} className={styles.sortable}>
                Email {filter.sortBy === 'email' && (filter.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Name</th>
              <th onClick={() => handleSortChange('role')} className={styles.sortable}>
                Role {filter.sortBy === 'role' && (filter.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSortChange('created_at')} className={styles.sortable}>
                Joined {filter.sortBy === 'created_at' && (filter.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSortChange('last_sign_in')} className={styles.sortable}>
                Last Active {filter.sortBy === 'last_sign_in' && (filter.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id}>
                <td className={styles.email}>
                  {user.avatarUrl && (
                    <img src={user.avatarUrl} alt="" className={styles.avatar} />
                  )}
                  {user.email}
                </td>
                <td>{user.fullName || '-'}</td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[`role-${user.role}`]}`}>
                    {user.role}
                  </span>
                  {user.roleExpiresAt && (
                    <span className={styles.expiry}>
                      Expires: {new Date(user.roleExpiresAt).toLocaleDateString()}
                    </span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}</td>
                <td>
                  <button
                    onClick={() => handleRoleChange(user)}
                    className={styles.changeRoleBtn}
                    title="Change user role"
                  >
                    Change Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.users.length === 0 && (
          <div className={styles.emptyState}>
            No users found matching your filters
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(Math.max(1, (filter.page || 1) - 1))}
          disabled={filter.page === 1}
          className={styles.pageBtn}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {filter.page || 1} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange((filter.page || 1) + 1)}
          disabled={(filter.page || 1) >= totalPages}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>

      {isModalOpen && selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          onAssign={handleAssignRole}
          onClose={() => setIsModalOpen(false)}
          isAssigning={isAssigning}
        />
      )}
    </div>
  )
}