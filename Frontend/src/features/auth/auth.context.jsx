import { createContext, useState, useContext } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem("token"); 
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)