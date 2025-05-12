import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Catalog from "./pages/Catalog";
import ProductDetails from "./pages/ProductDetails";
import SellerListings from "./pages/SellerListings";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import AdminPanel from "./pages/AdminPanel";
import Stores from "./pages/Stores";
import StoreDetails from "./pages/StoreDetails";
import CreateStore from "./pages/CreateStore";
import EditStore from "./pages/EditStore";
import RequestList from "./pages/RequestList";
import RequestDetails from "./pages/RequestDetails";
import CreateRequest from "./pages/CreateRequest";
import EditRequest from "./pages/EditRequest";
import AdminImagePreviewGenerator from "./pages/AdminImagePreviewGenerator";

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Redirect to catalog if user is logged in
  useEffect(() => {
    if (!loading && user && (location.pathname === "/login" || location.pathname === "/register")) {
      window.location.href = "/catalog";
    }
  }, [user, loading, location]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/stores/:id" element={<StoreDetails />} />
      <Route path="/requests" element={<RequestList />} />
      <Route path="/requests/:id" element={<RequestDetails />} />

      {/* Private routes (user must be logged in) */}
      <Route
        path="/profile"
        element={
          user ? (
            <Profile />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/seller/listings"
        element={
          user ? (
            <SellerListings />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/product/create"
        element={
          user ? (
            <CreateProduct />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/product/edit/:id"
        element={
          user ? (
            <EditProduct />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/store/create"
        element={
          user ? (
            <CreateStore />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/store/edit/:id"
        element={
          user ? (
            <EditStore />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/requests/create"
        element={
          user ? (
            <CreateRequest />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
      <Route
        path="/requests/edit/:id"
        element={
          user ? (
            <EditRequest />
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />

      {/* Admin routes */}
      <Route path="/admin">
        <Route
          index
          element={
            user?.user_metadata.user_type === "admin" ? (
              <AdminPanel />
            ) : (
              <Navigate to="/" replace state={{ from: location }} />
            )
          }
        />
        <Route path="preview-generator" element={<AdminImagePreviewGenerator />} />
      </Route>

      {/* Catch-all route for redirecting to catalog */}
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  );
}

export default App;
