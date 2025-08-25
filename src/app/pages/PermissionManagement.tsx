import { useState } from 'react'
import { usePermissions } from '@features/permissions'
import {
  PermissionMatrix,
  RoleBuilder,
  ResourcePermissions,
  PermissionInheritance,
  PermissionTester
} from '@features/permissions/components'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import styles from './AdminDashboard.module.css'

type TabValue = 'matrix' | 'roles' | 'resources' | 'groups' | 'testing'

export function PermissionManagement() {
  const [activeTab, setActiveTab] = useState<TabValue>('matrix')
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined)
  const [_selectedUserId, _setSelectedUserId] = useState<string>('current-user') // Default to current user
  const [showRoleBuilder, setShowRoleBuilder] = useState(false)
  const { canAdmin } = usePermissions()

  // Redirect if not admin
  if (!canAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          You do not have permission to access this page.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Permission Management</h1>
        <p className={styles.subtitle}>
          Configure roles, permissions, and access control for the application
        </p>
      </div>

      {showRoleBuilder ? (
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h2>Create New Role</h2>
            <button
              onClick={() => setShowRoleBuilder(false)}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
          <RoleBuilder
            onComplete={(roleId) => {
              setSelectedRoleId(roleId)
              setShowRoleBuilder(false)
              setActiveTab('matrix')
            }}
            onCancel={() => setShowRoleBuilder(false)}
          />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="matrix" className={styles.tabTrigger}>
              Permission Matrix
            </TabsTrigger>
            <TabsTrigger value="roles" className={styles.tabTrigger}>
              Role Management
            </TabsTrigger>
            <TabsTrigger value="resources" className={styles.tabTrigger}>
              Resource Permissions
            </TabsTrigger>
            <TabsTrigger value="groups" className={styles.tabTrigger}>
              Inheritance
            </TabsTrigger>
            <TabsTrigger value="testing" className={styles.tabTrigger}>
              Test Permissions
            </TabsTrigger>
          </TabsList>

          <div className={styles.tabContent}>
            <TabsContent value="matrix">
              <div className={styles.sectionHeader}>
                <h2>Permission Matrix</h2>
                <p>Configure role permissions in a grid view</p>
              </div>
              <PermissionMatrix
                selectedRoleIds={selectedRoleId ? [selectedRoleId] : undefined}
                onRoleSelectionChange={(roleIds) => 
                  setSelectedRoleId(roleIds[0] || undefined)
                }
              />
            </TabsContent>

            <TabsContent value="roles">
              <div className={styles.sectionHeader}>
                <h2>Role Management</h2>
                <button
                  onClick={() => setShowRoleBuilder(true)}
                  className={styles.primaryButton}
                >
                  Create New Role
                </button>
              </div>
              <div className={styles.roleManagement}>
                <div className={styles.roleList}>
                  <PermissionInheritance
                    selectedRoleId={selectedRoleId}
                    onRoleSelect={(roleId) => setSelectedRoleId(roleId ?? undefined)}
                    showDragDrop={true}
                  />
                </div>
                {selectedRoleId && (
                  <div className={styles.roleDetails}>
                    <h3>Role Permissions</h3>
                    <ResourcePermissions
                      userId={_selectedUserId}
                      compact={false}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <div className={styles.sectionHeader}>
                <h2>Resource-Specific Permissions</h2>
                <p>Manage permissions for individual resources</p>
              </div>
              <ResourcePermissions userId={_selectedUserId} />
            </TabsContent>

            <TabsContent value="groups">
              <div className={styles.sectionHeader}>
                <h2>Role Inheritance</h2>
                <p>Configure role hierarchies and inheritance relationships</p>
              </div>
              <PermissionInheritance
                showDragDrop={true}
              />
            </TabsContent>

            <TabsContent value="testing">
              <div className={styles.sectionHeader}>
                <h2>Permission Tester</h2>
                <p>Test and debug permission configurations</p>
              </div>
              <PermissionTester />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  )
}