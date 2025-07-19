import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-dev-primary-bg">
      <Outlet />
    </div>
  )
} 