import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { AccommodationsProvider } from '../context/AccommodationsContext';
import { PropertiesProvider } from '../context/PropertiesContext';
import { CompareProvider, useCompare } from '../context/CompareContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CompareBar } from '../components/CompareBar';
import { CompareModal } from '../components/CompareModal';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { NotFound } from '../pages/NotFound';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Dashboard } from '../pages/Dashboard';
import { Onboarding } from '../pages/Onboarding';
import { Profile } from '../pages/Profile';
import { SearchRooms } from '../pages/SearchRooms';
import { AccommodationDetail } from '../pages/AccommodationDetail';
import { RoomDetail } from '../pages/RoomDetail';
import { PropertyDetail } from '../pages/PropertyDetail';
import { Favorites } from '../pages/Favorites';
import { Applications } from '../pages/Applications';
import { Messages } from '../pages/Messages';
import { Verification } from '../pages/Verification';
import { MyHome } from '../pages/MyHome';
import { LandlordDashboard } from '../pages/LandlordDashboard';
import { LandlordListings } from '../pages/LandlordListings';
import { LandlordApplications } from '../pages/LandlordApplications';
import { LandlordAnalytics } from '../pages/LandlordAnalytics';
import { LandlordMaintenance } from '../pages/LandlordMaintenance';
import { LandlordPropertyDetail } from '../pages/LandlordPropertyDetail';
import { NewListing } from '../pages/NewListing';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminProperties } from '../pages/admin/AdminProperties';
import { AdminReports } from '../pages/admin/AdminReports';
import { AdminAudit } from '../pages/admin/AdminAudit';
import { AdminAnalytics } from '../pages/admin/AdminAnalytics';
import { AdminSettings } from '../pages/admin/AdminSettings';
import { Terms } from '../pages/Terms';
import { Privacy } from '../pages/Privacy';

function AppShell() {
  const { compareItems, removeFromCompare } = useCompare();
  const [showCompareModal, setShowCompareModal] = useState(false);

  return (
    <>
      <div className={`min-h-screen flex flex-col${compareItems.length > 0 ? ' pb-20' : ''}`}>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<><Navbar /><Terms /></>} />
          <Route path="/privacy" element={<><Navbar /><Privacy /></>} />
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/room/:id" element={<><Navbar /><RoomDetail /></>} />
          <Route path="/property/:id" element={<><Navbar /><PropertyDetail /></>} />

          {/* Estudante */}
          <Route path="/dashboard" element={<ProtectedRoute allowedTypes={['student']}><Navbar /><Dashboard /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute allowedTypes={['student']}><Onboarding /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedTypes={['student']}><Navbar /><Profile /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute allowedTypes={['student']}><Navbar /><Favorites /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute allowedTypes={['student']}><Navbar /><Applications /></ProtectedRoute>} />
          <Route path="/my-home" element={<ProtectedRoute allowedTypes={['student']}><Navbar /><MyHome /></ProtectedRoute>} />
          <Route path="/accommodation/:id" element={<ProtectedRoute allowedTypes={['student']}><Navbar /><AccommodationDetail /></ProtectedRoute>} />

          {/* /search aberto a estudantes E senhorios */}
          <Route path="/search" element={<ProtectedRoute allowedTypes={['student', 'landlord']}><Navbar /><SearchRooms /></ProtectedRoute>} />

          {/* Partilhadas */}
          <Route path="/messages" element={<ProtectedRoute allowedTypes={['student', 'landlord']}><Navbar /><Messages /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute allowedTypes={['student', 'landlord']}><Navbar /><Verification /></ProtectedRoute>} />

          {/* Senhorio */}
          <Route path="/landlord/dashboard" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><LandlordDashboard /></ProtectedRoute>} />
          <Route path="/landlord/listings" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><LandlordListings /></ProtectedRoute>} />
          <Route path="/landlord/properties" element={<ProtectedRoute allowedTypes={['landlord']}><Navigate to="/landlord/listings" replace /></ProtectedRoute>} />
          <Route path="/landlord/new-listing" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><NewListing /></ProtectedRoute>} />
          <Route path="/landlord/applications" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><LandlordApplications /></ProtectedRoute>} />
          <Route path="/landlord/analytics" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><LandlordAnalytics /></ProtectedRoute>} />
          <Route path="/landlord/maintenance" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><LandlordMaintenance /></ProtectedRoute>} />
          <Route path="/landlord/property/:id" element={<ProtectedRoute allowedTypes={['landlord']}><Navbar /><LandlordPropertyDetail /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminProperties /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminAudit /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedTypes={['admin']}><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

          {/* 404 — tem de ser sempre a última */}
          <Route path="*" element={<><Navbar /><NotFound /></>} />
        </Routes>

        <Toaster position="top-right" richColors />
      </div>

      <CompareBar onCompare={() => setShowCompareModal(true)} />

      {showCompareModal && compareItems.length >= 2 && (
        <CompareModal
          items={compareItems}
          onClose={() => setShowCompareModal(false)}
          onRemove={(roomId) => {
            removeFromCompare(roomId);
            if (compareItems.length <= 2) setShowCompareModal(false);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <PropertiesProvider>
            <AccommodationsProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <AppShell />
                </CompareProvider>
              </FavoritesProvider>
            </AccommodationsProvider>
          </PropertiesProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
