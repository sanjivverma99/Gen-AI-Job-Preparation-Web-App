import { StrictMode } from 'react'
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { InterviewProvider } from "./features/interview/interview.context"
import App from './App.jsx'
import "./style.scss"

createRoot(document.getElementById('root')).render(
    <AuthProvider>
        <InterviewProvider>
            <RouterProvider router={router} />
        </InterviewProvider>
    </AuthProvider>
)