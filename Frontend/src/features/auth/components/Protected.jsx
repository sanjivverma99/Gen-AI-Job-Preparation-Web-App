import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from "react";
import { Children } from "react";

const Protected = ({children}) => {
    const {loading, user} = useAuth ()
    

    if(loading){
        return(<main><h1>Loading...</h1></main>)
    }

    if(!user){

        return<navigate to={'/login'}/>
    }

    return children
}

export default Protected