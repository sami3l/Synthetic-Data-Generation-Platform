import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, initializeUser, logout } from "@/features/auth/authSlice";
import { RootState, AppDispatch } from "@/store";



export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, loading: reduxLoading } = useSelector((state: RootState) => state.auth);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      // Only dispatch if Redux has nothing
      if (storedToken && storedUser && !user) {
        dispatch(initializeUser({ user: JSON.parse(storedUser), token: storedToken }));
      }
      setIsInitialized(true); // ✅ Mark auth as ready
    };
    init();
  }, [dispatch]); // only run once

  return {
    user,
    token,
    loading: reduxLoading || !isInitialized,
    isInitialized,
  };
};

// export const useAuth = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { user, token, loading: reduxLoading, error } = useSelector(
//     (state: RootState) => state.auth
//   );

//   // ✅ track initialization
//   const [isInitialized, setIsInitialized] = useState(false);
//   const initCalledRef = useRef(false);

//   // ✅ initialize only once
//   useEffect(() => {
//     if (initCalledRef.current) return;
//     initCalledRef.current = true;

//     let mounted = true;

//     const load = async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem("token");
//         const userData = await AsyncStorage.getItem("user");

//         if (storedToken && userData) {
//           const parsedUser = JSON.parse(userData);

//           // ✅ dispatch only if Redux doesn't already have the same token/user
//           if (!token || !user) {
//             dispatch(initializeUser({ user: parsedUser, token: storedToken }));
//           }
//         }
//       } catch (err) {
//         console.error("useAuth load error:", err);
//       } finally {
//         if (mounted) setIsInitialized(true);
//       }
//     };

//     load();

//     return () => {
//       mounted = false;
//     };
//   }, []); // ✅ empty dependency array → runs only once

//   // ✅ stable login function
//   const handleLogin = useCallback(async (email: string, password: string) => {
//     try {
//       const result = await (dispatch(login({ email, password })) as any).unwrap();

//       if (result.user && result.access_token) {
//         await AsyncStorage.setItem("user", JSON.stringify(result.user));
//         await AsyncStorage.setItem("token", result.access_token);
//       }
//       return true;
//     } catch (err) {
//       return false;
//     }
//   }, [dispatch]);

//   // ✅ stable logout function
//   const handleLogout = useCallback(async () => {
//     await AsyncStorage.removeItem("user");
//     await AsyncStorage.removeItem("token");
//     dispatch(logout());
//   }, [dispatch]);

//   return {
//     user,
//     token,
//     loading: reduxLoading || !isInitialized,
//     error,
//     login: handleLogin,
//     logout: handleLogout,
//     isInitialized,
//   };
// };
