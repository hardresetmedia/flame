import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { State } from '../../store/reducers';

interface Props {
  children: ReactNode;
}

// react-router v6 style guard: wraps the protected element instead of
// wrapping <Route> (v6 dropped custom route components).
export const ProtectedRoute = ({ children }: Props): JSX.Element => {
  const { isAuthenticated } = useSelector((state: State) => state.auth);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <Navigate to="/settings/app" replace />;
};
