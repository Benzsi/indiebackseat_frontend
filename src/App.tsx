import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './AppLists.css'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Profile } from './pages/Profile'
import { AdminUsers } from './pages/AdminUsers'
import { MyLists } from './pages/MyLists'
import { AISearch } from './pages/AISearch'
import type { User } from './services/api'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Az oldal betöltésekor helyreállítjuk az előző felhasználót
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Felhasználó adatok betöltése sikertelen', err)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleRegisterSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  if (loading) {
    return <div>Betöltés...</div>
  }

  return (
    <BrowserRouter>
      <Header
        isAuthenticated={user !== null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<Home user={user} searchQuery={searchQuery} />} />
          <Route path="/mylists" element={<MyLists user={user} />} />
          <Route path="/ai-search" element={<AISearch />} />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Register onRegisterSuccess={handleRegisterSuccess} />
              )
            }
          />
          <Route path="/profile" element={<Profile user={user} onUserUpdate={handleUserUpdate} />} />
          <Route path="/admin" element={<AdminUsers user={user} />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
