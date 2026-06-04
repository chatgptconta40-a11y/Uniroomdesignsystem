import { HashRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { AccommodationsProvider } from '../context/AccommodationsContext';
import { PropertiesProvider } from '../context/PropertiesContext';
import { CompareProvider, useCompare } from '../context/CompareContext';
import { CompareBar } from '../components/CompareBar';
import { CompareModal } from '../components/CompareModal';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Dashboard } from '../pages/Dashboard';
import { Onboarding } from '../pages/Onboarding';
import { Profile } from '../pages/Profile';
import { SearchRooms } from '../pages/SearchRooms';
import { AccommodationDetail } from '../pages/AccommodationDetail';
import { PropertyDetail } from '../pages/PropertyDetail';
import { RoomDetail } from '../pages/RoomDetail';
import { Favorites } from '../pages/Favorites';
import { Applications } from '../pages/Applications';
import { StudentVisitRequests } from '../pages/StudentVisitRequests';
import { Messages } from '../pages/Messages';
import { Verification } from '../pages/Verification';
import { MyHome } from '../pages/MyHome';
import { LandlordDashboard } from '../pages/LandlordDashboard';
import { LandlordListings } from '../pages/LandlordListings';
import { LandlordApplications } from '../pages/LandlordApplications';
import { LandlordVisitRequests } from '../pages/LandlordVisitRequests';
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
import { AdminProfile } from '../pages/admin/AdminProfile';
import { RouteDataRefresher } from '../components/RouteDataRefresher';
import { ErrorBoundary } from '../components/ErrorBoundary';

function AppShell() {
  const { compareItems, removeFromCompare } = useCompare();
  const [showCompareModal, setShowCompareModal] = useState(false);

  return (
    <>
      <RouteDataRefresher />
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <SearchRooms />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accommodation/:id"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <AccommodationDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/property/:id"
            element={
              <>
                <Navbar />
                <PropertyDetail />
              </>
            }
          />

          <Route
            path="/room/:id"
            element={
              <>
                <Navbar />
                <RoomDetail />
              </>
            }
          />

          <Route
            path="/favorites"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <Favorites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <Applications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/visit-requests"
            element={
              <ProtectedRoute allowedTypes={['student']}>
                <Navbar />
                <StudentVisitRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verification"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <Verification />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-home"
            element={
              <ProtectedRoute allowedTypes={['student', 'landlord']}>
                <Navbar />
                <MyHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/dashboard"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/listings"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordListings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/properties"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navigate to="/landlord/listings" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/new-listing"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <NewListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/applications"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/visit-requests"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordVisitRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/contracts"
            element={<Navigate to="/landlord/dashboard" replace />}
          />

          <Route
            path="/landlord/payments"
            element={<Navigate to="/landlord/dashboard" replace />}
          />

          <Route
            path="/landlord/analytics"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/maintenance"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordMaintenance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/landlord/property/:id"
            element={
              <ProtectedRoute allowedTypes={['landlord']}>
                <Navbar />
                <LandlordPropertyDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/properties"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminProperties />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminReports />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminAudit />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminAnalytics />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminLayout>
                  <AdminProfile />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {compareItems.length > 0 && (
        <CompareBar
          items={compareItems}
          onRemove={removeFromCompare}
          onCompare={() => setShowCompareModal(true)}
        />
      )}

      <CompareModal
        open={showCompareModal}
        onOpenChange={setShowCompareModal}
        items={compareItems}
        onRemove={removeFromCompare}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <PropertiesProvider>
            <AccommodationsProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <AppShell />
                  <Toaster richColors position="top-right" />
                </CompareProvider>
              </FavoritesProvider>
            </AccommodationsProvider>
          </PropertiesProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
