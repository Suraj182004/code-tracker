import { Outlet } from 'react-router-dom'

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-dev-primary-bg">
      <div className="flex">
        {/* Sidebar placeholder */}
        <div className="w-64 bg-dev-secondary-bg border-r border-dev-text-muted/20">
          <div className="p-4">
            <h2 className="text-dev-text-primary font-semibold">Dashboard</h2>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
} 