import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GuestOnly, ProtectedRoute } from './components/ProtectedRoute';
import { Spinner } from './components/ui';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/public/Home';
import { NotFound, PolicyPage } from './pages/public/Misc';

// Signed-in areas are split into their own chunks so the public homepage stays light.
const MarketsPage = lazy(() => import('./pages/public/MarketsPage'));
const Kitchen = lazy(() => import('./pages/public/Kitchen'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

const CustomerDashboard = lazy(() => import('./pages/customer/Dashboard'));
const NewBooking = lazy(() => import('./pages/customer/NewBooking'));
const Bookings = lazy(() => import('./pages/customer/Bookings'));
const BookingDetail = lazy(() => import('./pages/customer/BookingDetail'));
const PaymentCallback = lazy(() => import('./pages/customer/PaymentCallback'));
const Addresses = lazy(() => import('./pages/customer/Addresses'));
const Lists = lazy(() => import('./pages/customer/Lists').then((m) => ({ default: m.Lists })));
const ListEdit = lazy(() => import('./pages/customer/Lists').then((m) => ({ default: m.ListEdit })));
const Purchases = lazy(() => import('./pages/customer/Purchases'));
const Restocking = lazy(() => import('./pages/customer/Restocking'));
const Settings = lazy(() => import('./pages/customer/Settings'));
const KitchenOrders = lazy(() => import('./pages/customer/kitchen/KitchenOrders'));
const KitchenNew = lazy(() => import('./pages/customer/kitchen/KitchenNew'));
const KitchenOrder = lazy(() => import('./pages/customer/kitchen/KitchenOrder'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminBookings = lazy(() => import('./pages/admin/Bookings'));
const BookingReview = lazy(() => import('./pages/admin/BookingReview'));
const Calendar = lazy(() => import('./pages/admin/Calendar'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const CustomerDetail = lazy(() => import('./pages/admin/Customers').then((m) => ({ default: m.CustomerDetail })));
const Catalog = lazy(() => import('./pages/admin/Catalog'));
const Markets = lazy(() => import('./pages/admin/Markets'));
const ServiceSettings = lazy(() => import('./pages/admin/ServiceSettings'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const KitchenQueue = lazy(() => import('./pages/admin/kitchen/KitchenQueue'));
const KitchenOrderAdmin = lazy(() => import('./pages/admin/kitchen/KitchenOrderAdmin'));
const KitchenMenu = lazy(() => import('./pages/admin/kitchen/KitchenMenu'));
const KitchenSetup = lazy(() => import('./pages/admin/kitchen/KitchenSetup'));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="markets" element={<MarketsPage />} />
          <Route path="kitchen" element={<Kitchen />} />
          <Route path="privacy" element={<PolicyPage kind="privacy" />} />
          <Route path="terms" element={<PolicyPage kind="terms" />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route element={<GuestOnly />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Route>

        <Route element={<AuthLayout variant="admin" />}>
          <Route element={<GuestOnly />}>
            <Route path="admin/login" element={<Login portal="admin" />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="app" element={<AppLayout />}>
            <Route index element={<CustomerDashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/new" element={<NewBooking />} />
            <Route path="bookings/:reference" element={<BookingDetail />} />
            <Route path="payments/callback" element={<PaymentCallback />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="lists" element={<Lists />} />
            <Route path="lists/:id" element={<ListEdit />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="restocking" element={<Restocking />} />
            <Route path="kitchen" element={<KitchenOrders />} />
            <Route path="kitchen/new" element={<KitchenNew />} />
            <Route path="kitchen/orders/:reference" element={<KitchenOrder />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['operator']} loginPath="/admin/login" />}>
          <Route path="admin" element={<AppLayout variant="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="bookings/:reference" element={<BookingReview />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="markets" element={<Markets />} />
            <Route path="settings/service" element={<ServiceSettings />} />
            <Route path="payments" element={<Payments />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="kitchen" element={<KitchenQueue />} />
            <Route path="kitchen/orders/:reference" element={<KitchenOrderAdmin />} />
            <Route path="kitchen/menu" element={<KitchenMenu />} />
            <Route path="kitchen/setup" element={<KitchenSetup />} />
            <Route path="settings" element={<Settings admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
