import UserRoutes from './routes/user/UserRoutes'
import AdminRoutes from './routes/admin/AdminRoutes'
import { Toaster } from 'react-hot-toast'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Routes, Route } from "react-router-dom";
import './App.css';

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 2500,
          style: {
            background: "rgba(20, 20, 20, 0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#FFFFFF",
            borderRadius: "14px",
            padding: "14px 18px",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
            maxWidth: "380px",
            letterSpacing: "0.01em",
          },
          success: {
            icon: <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={2.5} />,
            style: {
              borderLeft: "2px solid #4ade80",
            },
          },
          error: {
            icon: <XCircle className="w-5 h-5 text-red-400" strokeWidth={2.5} />,
            style: {
              borderLeft: "2px solid #f87171",
            },
          },
        }}
      />
      <Routes>
        <Route path="/*" element={<UserRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </>
  )
}

export default App;
