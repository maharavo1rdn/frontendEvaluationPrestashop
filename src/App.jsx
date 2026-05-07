import { useState } from 'react'
import Sidebar    from './components/Sidebar/Sidebar'
import AppRoutes  from './routes/AppRoutes'
import './App.css'

export default function App() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />
      <main
        className="app-main"
        style={{ marginLeft: collapsed ? '64px' : '260px' }}
        aria-label="Contenu principal"
      >
        <AppRoutes />
      </main>
    </div>
  )
}