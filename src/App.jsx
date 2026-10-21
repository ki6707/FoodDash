import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/shared';
import { AdminLayout, CustomerLayout, DeliveryLayout } from './layouts/layouts';
import Login from './pages/Login';

import Home from './customer/Home';
import Restaurants from './customer/Restaurants';
import RestaurantMenu from './customer/RestaurantMenu';
import Cart from './customer/Cart';
import Checkout from './customer/Checkout';
import { OrderDetail, Orders } from './customer/Orders';
import Profile from './customer/Profile';

import { AdminCoupons, AdminCustomers, AdminDashboard, AdminDeliveryPartners, AdminMenu, AdminOrders, AdminPayments, AdminReports, AdminRestaurants } from './admin/AdminPages';

import { DeliveryActive, DeliveryDashboard, DeliveryEarnings, DeliveryHistory, DeliveryRequests } from './delivery/DeliveryPages';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:restaurantId" element={<RestaurantMenu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute role="customer"><Orders /></ProtectedRoute>} />
        <Route path="orders/:orderId" element={<ProtectedRoute role="customer"><OrderDetail /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="/delivery" element={<ProtectedRoute role="delivery"><DeliveryLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DeliveryDashboard />} />
        <Route path="requests" element={<DeliveryRequests />} />
        <Route path="active" element={<DeliveryActive />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="earnings" element={<DeliveryEarnings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
