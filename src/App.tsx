import { AuthProvider } from './features/auth/context/AuthContext';
import { AppRoutes } from './app/routes/AppRoutes';
import { ToastProvider } from './context/ToastContext';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
