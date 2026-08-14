/**
 * ============================================================
 * Scout Report API
 * ============================================================
 *
 * File:
 * server/controllers/auth.controller.js
 *
 * Authentication Controller
 *
 * Responsibilities:
 *
 * - Handle HTTP authentication requests
 * - Delegate authentication logic
 * - Manage JWT cookies
 * - Return consistent API responses
 *
 * ============================================================
 */

"use strict";


const auth = require("../auth");


// ============================================================
// Cookie Configuration
// ============================================================

const COOKIE_NAME =
    "access_token";


const COOKIE_TTL =
    Number(
        process.env.JWT_TTL_SECONDS ||
        28800
    );


const COOKIE_OPTIONS = {

    httpOnly:true,

    sameSite:"lax",

    secure:
        process.env.NODE_ENV === "production",

    priority:"high",

    maxAge:
        COOKIE_TTL * 1000,

    path:"/"

};



const CLEAR_COOKIE_OPTIONS = {

    httpOnly:true,

    sameSite:"lax",

    secure:
        process.env.NODE_ENV === "production",

    path:"/"

};



// ============================================================
// Cookie Helpers
// ============================================================

function setAuthCookie(
    res,
    token
){

    if(!token){
        return;
    }


    res.cookie(
        COOKIE_NAME,
        token,
        COOKIE_OPTIONS
    );

}



function clearAuthCookie(res){

    res.clearCookie(
        COOKIE_NAME,
        CLEAR_COOKIE_OPTIONS
    );

}



// ============================================================
// Response Helper
// ============================================================

function authResponse(result){

    return {

        success:true,

        token:
            result.token,

        user:
            result.user,

        expiresAt:
            result.expiresAt

    };

}



// ============================================================
// Register
// POST /auth/register
// ============================================================

async function register(
    req,
    res,
    next
){

    try {


        const result =
            await auth.registerUser(
                req.body || {},
                {

                    currentUser:
                        req.user || null

                }
            );



        setAuthCookie(
            res,
            result.token
        );



        return res
            .status(201)
            .json(
                authResponse(result)
            );


    }
    catch(error){

        next(error);

    }

}



// ============================================================
// Login
// POST /auth/login
// ============================================================

async function login(
    req,
    res,
    next
){

    try {


        const result =
            await auth.loginUser(
                req.body || {}
            );



        setAuthCookie(
            res,
            result.token
        );



        return res
            .status(200)
            .json(
                authResponse(result)
            );


    }
    catch(error){

        next(error);

    }

}



// ============================================================
// Logout
// POST /auth/logout
// ============================================================

async function logout(
    req,
    res,
    next
){

    try {


        if(req.session?.id){


            await auth.logoutSession(
                req.session.id
            );


        }



        clearAuthCookie(res);



        return res
            .status(204)
            .send();



    }
    catch(error){

        next(error);

    }

}



// ============================================================
// Current User
// GET /auth/me
// ============================================================

async function me(
    req,
    res,
    next
){

    try {


        return res
            .status(200)
            .json({

                success:true,

                authenticated:true,

                user:
                    req.user || null,


                session:
                    req.session || null

            });



    }
    catch(error){

        next(error);

    }

}



// ============================================================
// Exports
// ============================================================

module.exports = {

    register,

    login,

    logout,

    me

};