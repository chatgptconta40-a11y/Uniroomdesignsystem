import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
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
import { RoomDetail } from '../pages/RoomDetail';
import { Favorites } from '../pages/Favorites';
import { Applications } from '../pages/Applications';
import { Messages } from '../pages/Messages';
import { Verification } from '../pages/Verification';
import { MyHome } from '../pages/MyHome';
import { LandlordDashboard } from '../pages/LandlordDashboard';
import { LandlordListings } from '../pages/LandlordListings';
import { LandlordProperties } from '../pages/LandlordProperties';
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
import { AdminAnalytics } from '../pages/admin/AdminAnalytics';
import { AdminSettings } from '../pages/admin/AdminSettings';

function AppShell() {
  const { compareItems, removeFromCompare } = useCompare();
  const [showCompareModal, setShowCompareModal] = useState(false);

  return (
    <>
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
                      <ProtectedRoute>
                        <Navbar />
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <Onboarding />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <SearchRooms />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/accommodation/:id"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <AccommodationDetail />
                      </ProtectedRoute>
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
                      <ProtectedRoute>
                        <Navbar />
                        <Favorites />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/applications"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <Applications />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <Messages />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/verification"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <Verification />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-home"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <MyHome />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/dashboard"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/listings"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordListings />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/properties"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordProperties />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/new-listing"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <NewListing />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/applications"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordApplications />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/analytics"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordAnalytics />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/maintenance"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordMaintenance />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/landlord/property/:id"
                    element={
                      <ProtectedRoute>
                        <Navbar />
                        <LandlordPropertyDetail />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <AdminUsers />
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/properties"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <AdminProperties />
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <AdminReports />
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <AdminAnalytics />
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute>
                        <AdminLayout>
                          <AdminSettings />
                        </AdminLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
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
    </BrowserRouter>
  );
}