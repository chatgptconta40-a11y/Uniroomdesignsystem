import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { AccommodationsProvider } from '../context/AccommodationsContext';
import { PropertiesProvider } from '../context/PropertiesContext';
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
import { NewListing } from '../pages/NewListing';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminUsers } from '../pages/AdminUsers';
import { AdminListings } from '../pages/AdminListings';
import { AdminReports } from '../pages/AdminReports';
import { AdminAnalytics } from '../pages/AdminAnalytics';
import { AdminSettings } from '../pages/AdminSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PropertiesProvider>
          <AccommodationsProvider>
            <FavoritesProvider>
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
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute>
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/listings"
                    element={
                      <ProtectedRoute>
                        <AdminListings />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute>
                        <AdminReports />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute>
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <Toaster position="top-right" richColors />
              </div>
            </FavoritesProvider>
          </AccommodationsProvider>
        </PropertiesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}