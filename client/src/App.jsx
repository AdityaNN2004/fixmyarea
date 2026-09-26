import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import AdminRoute from './components/AdminRoute';       // imports
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
                <Route element={<AdminRoute />}>                {/* own block, outside ProtectedRoute */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<h1 className="p-8">Members only ✅</h1>} />
          <Route path="/report" element={<ReportIssue />} />
        </Route>
        <Route path="/issues/:id" element={<IssueDetail />} />
      </Routes>
    </div>
  );
}