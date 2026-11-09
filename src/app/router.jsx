import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@features/auth/pages/LoginPage";
import RegisterPage from "@features/auth/pages/RegisterPage";
import LauncherPage from "@/features/marketplace/pages/launcher/LauncherPage";
import Marketplace from "@/features/marketplace/pages/home/Marketplace";
import ProductDetailPage from "@/features/marketplace/pages/product-detail/ProductDetailPage";
import StudioPage from "@/features/marketplace/pages/studio/StudioPage";
import ProfilePage from "@features/profile/pages/ProfilePage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import adminRoutes from "@/features/admin/routers/adminRoute";
import AppLayout from "@/common/components/layout/AppLayout";
import AdminLayout from "@/features/admin/components/layout/AdminLayout";
import publisherRoutes from "@/features/publisher/routers/publisherRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    // AppLayout mount một lần duy nhất, không bị destroy khi navigate
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Marketplace />,
      },

      {
        path: "/products/:productId",
        element: <ProductDetailPage />,
      },
      {
        path: "/launcher",
        element: <LauncherPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/studio",
        element: <StudioPage />,
      },
    ],
  },
  // ── Admin routes ──────────────────────────────────────────
  {
    element: <AdminLayout />,
    children: adminRoutes(),
  },
  // Publisher routes
  {
    element: <AppLayout />,
    children: publisherRoutes(),
  },
]);
