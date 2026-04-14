import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './components.css'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Profile } from './pages/Profile'
import { AdminUsers } from './pages/AdminUsers'
import { MyLists } from './pages/MyLists'
import { AISearch } from './pages/AISearch'
import { GameDetails } from './pages/GameDetails'
import { DevLogs } from './pages/DevLogs'
import { DevLogDetail } from './pages/DevLogDetail'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { Contact } from './pages/Contact'
import { Footer } from './components/Footer'
import type { User } from './services/api'
import { Filter, Star, RotateCcw } from 'lucide-react'
import { BiUpvote } from 'react-icons/bi'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'devlogs'>('overview');
  
  // Filtering states moved to App level for global access and positioning
  const [selectedCategory, setSelectedCategory] = useState<string>('Összes');
  const [selectedMode, setSelectedMode] = useState<string>('Összes');
  const [selectedRating, setSelectedRating] = useState<string>('');
  
  // Sorting states
  const [sortBy, setSortBy] = useState<string>('abc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const GameCategories = ['Összes', 'REGÉNY', 'NOVELLA', 'FORGATÓJáték', 'EGYÉB'];
  const GameModes = ['Összes', 'KEMÉNYFÉNYES', 'PUHAFÉNYES', 'E-Game', 'HANGOSJáték'];

  const devCategories = [
    'Összes', 'ACTION', 'PUZZLE', 'RPG', 'PLATFORMER', 'HORROR', 'ADVENTURE', 'SANDBOX',
    'SIMULATION', 'STRATEGY', 'SPORTS', 'RACING', 'FIGHTING', 'SHOOTER',
    'SURVIVAL', 'STEALTH', 'ROGUELIKE', 'MOBA', 'MMORPG', 'TOWER_DEFENSE',
    'PARTY', 'CARD_GAME', 'RHYTHM'
  ];
  const devModes = [
    'Összes', 'SINGLE_PLAYER', 'MULTIPLAYER', 'CO_OP', 'BATTLE_ROYALE', 'OPEN_WORLD',
    'LINEAR', 'METROIDVANIA', 'SOULSLIKE', 'FIRST_PERSON', 'THIRD_PERSON',
    'VR', 'AUTOSHOOTER', 'TEXT_BASED'
  ];

  // Helper to determine active context
  const isDevLogContext = activeTab === 'devlogs' || window.location.pathname.startsWith('/devlogs');
  const isGameContext = activeTab === 'games';
  const isProjectContext = isDevLogContext || isGameContext;
  
  const currentCategories = isProjectContext ? devCategories : GameCategories;
  const currentModes = isProjectContext ? devModes : GameModes;

  useEffect(() => {
    setSelectedCategory('Összes');
    setSelectedMode('Összes');
    setSelectedRating('');
  }, [isProjectContext, activeTab]);

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
    setActiveTab('overview')
  }

  const handleRegisterSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setActiveTab('overview')
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
      <div className="min-h-screen flex flex-col">
        <Header
          isAuthenticated={user !== null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
          onResetDashboard={() => setActiveTab('overview')}
        />
        
        {/* ... (rest of the header strip) ... */}
      <div
        className="overflow-hidden bg-[#473472] border-b border-[#53629E]/40 z-40 shadow-lg transition-all duration-400"
        style={{
          display: 'grid',
          gridTemplateRows: isFilterOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ minHeight: 0 }}>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 flex flex-col gap-6">
            
            {/* Row 1: Filters */}
             <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#87BAC3] uppercase tracking-widest">
                  <Filter size={13} /> {isProjectContext ? 'Projekt kategória' : 'Játék kategória'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#53629E]/40 border border-[#53629E] text-[#D6F4ED] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#87BAC3] transition-all duration-200 cursor-pointer"
                >
                  {currentCategories.map(cat => <option key={cat} value={cat} className="bg-[#473472]">{cat}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#87BAC3] uppercase tracking-widest">
                  <Filter size={13} /> {isProjectContext ? 'Játékmód' : 'Kiadás'}
                </label>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="bg-[#53629E]/40 border border-[#53629E] text-[#D6F4ED] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#87BAC3] transition-all cursor-pointer"
                >
                  {currentModes.map(mode => <option key={mode} value={mode} className="bg-[#473472]">{mode}</option>)}
                </select>
              </div>

               <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#87BAC3] uppercase tracking-widest">
                  {isDevLogContext ? (
                    <><BiUpvote size={13} className="text-amber-300" /> Upvotes</>
                  ) : (
                    <><Star size={13} className="text-amber-300" /> Értékelés</>
                  )}
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="bg-[#53629E]/40 border border-[#53629E] text-[#D6F4ED] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#87BAC3] transition-all duration-200 cursor-pointer"
                >
                  {isDevLogContext ? (
                    <>
                      <option value="" className="bg-[#473472]">Bármennyi upvote</option>
                      <option value="0-10" className="bg-[#473472]">0 - 10 upvote</option>
                      <option value="10-50" className="bg-[#473472]">10 - 50 upvote</option>
                      <option value="50-100" className="bg-[#473472]">50 - 100 upvote</option>
                      <option value="100+" className="bg-[#473472]">100+ upvote</option>
                    </>
                  ) : (
                    <>
                      <option value="" className="bg-[#473472]">Bármilyen értékelés</option>
                      <option value="4-5" className="bg-[#473472]">4 - 5 csillag</option>
                      <option value="3-4" className="bg-[#473472]">3 - 4 csillag</option>
                      <option value="2-3" className="bg-[#473472]">2 - 3 csillag</option>
                      <option value="1-2" className="bg-[#473472]">1 - 2 csillag</option>
                    </>
                  )}
                </select>
              </div>

              <button
                onClick={() => { setSelectedCategory('Összes'); setSelectedMode('Összes'); setSelectedRating(''); }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  (selectedCategory !== 'Összes' || selectedMode !== 'Összes' || selectedRating !== '')
                    ? 'bg-[#D6F4ED] text-[#473472] hover:bg-[#87BAC3] cursor-pointer'
                    : 'bg-[#53629E]/20 text-[#87BAC3]/40 cursor-not-allowed'
                }`}
              >
                <RotateCcw size={15} /> Alaphelyzet
              </button>
            </div>

            {/* Row 2: Sorting */}
            <div className="flex flex-wrap gap-4 items-center pt-4 border-t border-[#53629E]/20">
               <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-[#87BAC3] uppercase tracking-widest whitespace-nowrap">
                    Rendezés:
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'abc', label: 'ABC' },
                      { id: 'kedvelt', label: 'Kedveltek' },
                      ...(isGameContext ? [{ id: 'rating', label: 'Értékelés' }] : []),
                      { id: 'wishlist', label: isDevLogContext ? 'Upvotes' : 'Wishlist' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          sortBy === option.id 
                            ? 'bg-[#87BAC3] text-[#473472]' 
                            : 'bg-[#53629E]/40 text-[#D6F4ED] hover:bg-[#53629E]/60'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sortOrder === 'asc' 
                        ? 'bg-[#D6F4ED] text-[#473472]' 
                        : 'bg-[#53629E]/40 text-[#D6F4ED] hover:bg-[#53629E]/60'
                    }`}
                  >
                    Növekvő
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sortOrder === 'desc' 
                        ? 'bg-[#D6F4ED] text-[#473472]' 
                        : 'bg-[#53629E]/40 text-[#D6F4ED] hover:bg-[#53629E]/60'
                    }`}
                  >
                    Csökkenő
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<Home 
            user={user} 
            searchQuery={searchQuery} 
            selectedCategory={selectedCategory}
            selectedMode={selectedMode}
            selectedRating={selectedRating}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />} />
          <Route path="/games/:gameId" element={<GameDetails user={user} />} />
          <Route path="/mylists" element={<MyLists user={user} />} />
          <Route path="/ai-search" element={<AISearch user={user} />} />
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
          <Route path="/devlogs" element={<DevLogs 
            user={user} 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedMode={selectedMode}
            selectedRating={selectedRating}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />} />
          <Route path="/devlogs/:id" element={<DevLogDetail user={user} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App





