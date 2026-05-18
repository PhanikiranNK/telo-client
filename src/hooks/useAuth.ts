// client/src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { RootState } from '../store';
import { socketService } from '../config/socket';

// 1. Import the actual Firebase auth instance and mock flag
import { auth, isFirebaseMock } from '../config/firebase';

// 2. Import your Redux actions cleanly from your auth slice
import { authSuccess, logoutSuccess, setLoading } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isFirebaseMock) {
      // Direct pass-through for Dev Mock Mode
      dispatch(setLoading(false));
      
      // If we already have a mock token in Redux, trigger socket connection directly
      if (authState.isAuthenticated && authState.token) {
        socketService.connect(authState.token);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();

        dispatch(authSuccess({
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Anonymous User',
            photoURL: user.photoURL || null
          },
          token: token
        }));

        // 🚀 Open the sub-200ms connection pipeline to your local Node server immediately!
        socketService.connect(token);
      } else {
        dispatch(logoutSuccess());
        // Clean up connections when logging out
        socketService.disconnect();
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch, authState.isAuthenticated, authState.token]);

  return authState;
};