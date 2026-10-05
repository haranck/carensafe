import UserRoutes from './routes/user/UserRoutes'
import AdminRoutes from './routes/admin/AdminRoutes'
import { Toaster } from 'react-hot-toast'
import { Routes, Route } from "react-router-dom";
import AppToast from './components/common/AppToast';
import PwaUpdatePrompt from './components/common/PwaUpdatePrompt';
import './App.css';

const App = () => {
  return (
    <>
      {/* Every toast renders through AppToast (dark body, brand-gradient border), top-center */}
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 3000,
          success: { duration: 2500 },
          error: { duration: 4500 },
        }}
      >
        {(t) => <AppToast t={t} />}
      </Toaster>
      {/* Installed app: service worker registration + "New version available" banner */}
      <PwaUpdatePrompt />
      <Routes>
        <Route path="/*" element={<UserRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </>
  )
}

export default App;
