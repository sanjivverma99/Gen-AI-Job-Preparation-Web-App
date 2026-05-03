import axios from "axios";


const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

export async function register(username,email,password) {

    try{
        const response = await api.post("/api/auth/register",{
            username,email,password
        });
        return response.data
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
}



export async function login(email,password) {
try{
    const response = await api.post("/api/auth/login",{
        email,password
    });
    return response.data
    
   }catch (error) {
    console.error("Error logging in:", error);
    throw error;
   }
}
     

export async function logout() {
    try {
        const response = await api.post("/api/auth/logout");
        return response.data;
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
}

export async function postme() {
    try {
        const token = localStorage.getItem("token"); // or wherever you store it
        const response = await api.get("/api/auth/post-me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}