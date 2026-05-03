import {useContext,useEffect} from "react"
import {AuthContext} from "../auth.context.jsx"
import {login,register,logout,postme} from "../services/auth.api"


export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    const {user,setUser,loading,setLoading} = context

    const handleLogin = async (email,password) => {
        setLoading(true)
        try {
            const data = await login(email,password)
            setUser(data.user)
        } catch (error) {
            console.error("Login failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (username,email,password) => {
        setLoading(true)
        try {
            const data = await register(username,email,password)
            setUser(data.user)
        } catch (error) {
            console.error("Registration failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (error) {
            console.error("Logout failed:", error)
        } finally {
            setLoading(false)
        }
    }

  useEffect(()=>{
        const postAndSetUser = async ()=>{
            try{
            const data = await postme()
            setUser(data.user)
            }catch(err){}finally{
                
            setLoading(false)
            }
        }

        postAndSetUser()

    },[])

    return {user,loading,handleLogin,handleRegister,handleLogout}
}