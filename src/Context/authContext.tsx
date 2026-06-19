import { createContext, useContext, useState } from "react";

interface AuthContextType { //Shape of context
    token: string | null;
    username: string | null;
    isAuthenticated: boolean;
    login: (token: string, refreshToken: string) => void; //Login and logout to update local storage and re-render, doesn't interact with backend API
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null); //Create context with default value of null with the shape of AuthContextType interface (token, username, isAuthenticated, login and logout function)
//Create context in order to share auth state and functions across multiple components without prop drilling

//children of React.ReactNode type means any valid React child
export function AuthProvider({ children }: { children: React.ReactNode }) { //Object destructuring = Whatever is passed into AuthProvider as arg, take out children from it and use as variable in function
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('token') //Default to token in local storage if exists (ie. user already logged in)
    );
    const [username, setUsername] = useState<string | null>(
        localStorage.getItem('username') //Default to username in local storage if exists (ie. user already logged in)
    );

    const isAuthenticated = token !== null; //Derive isAuthenticated from whether token exists (If token exists, user is authenticated) (Gets updated when re-rendered after login/logout)

    function login(newToken: string, refreshToken: string) { //Login function takes in token, decodes it to get username, stores token and username in local storage and re-renders any components using this context with set...
        const payload = JSON.parse(atob(newToken.split('.')[1])); //atob = base64 decode
        const usernameFromToken = payload.sub;

        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('username', usernameFromToken);
        setToken(newToken);
        setUsername(usernameFromToken);
    }

    function logout() { //Clears local storage and re-renders any components using this context with set... to null values (ie. user logged out) (Also updates isAuthenticated to false since token and re-render)
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        setToken(null);
        setUsername(null);
    }

    return ( //AuthContext provides values/functions from AuthProvider to any child components (Used in app.tsx to wrap around entire app so all components can access auth context values/functions)
        <AuthContext.Provider value={{ token, username, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    ); //Children in return = Renders children extracted with destructuring inside the context box giving all inside the box values and functions

    //"<AuthContext.Provider value={{ token, username, isAuthenticated, login, logout }}> " - Fills context using .Provider method of created context, with values from function --> Gives this filled context to any children
}

export function useAuth() { //Custom hook to use auth context values/functions in any component (Must be used within AuthProvider)
    const context = useContext(AuthContext); //Contains values/functions from AuthContext (token, username, isAuthenticated, login and logout function)
    if (!context) throw new Error("useAuth must be used within an AuthProvider"); //If context is null, it means that useAuth is being used outside of AuthProvider, which is not allowed since it won't have access to the auth context values/functions. Throwing an error helps catch this mistake during development.
    return context;
}

//useAuth flow:
//1. Tries to get auth context using useContext hook
//2. If context is null, it means the place where useAuth is being used is not wrapped in AuthProvider

//useAuth for convience so we don't have to import useContext and AuthContext in every component that needs auth values/functions. Just import useAuth and call it to get access to auth context values/functions. Also provides error handling if used outside of AuthProvider.