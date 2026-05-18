import { AuthProvider } from './Context/authContext.tsx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
) //App sent in to AuthProvider as arg --> All components inside App can access auth context values/functions (token, username, isAuthenticated, login and logout function)
