/**
 * ============================================================
 * Scout Report API
 * ============================================================
 *
 * File:
 * server/middleware/requireSiteAuth.js
 *
 * Authentication Middleware
 *
 * ============================================================
 */

"use strict";

const auth = require("../auth");


const PUBLIC_PATHS = new Set([
    "/",
    "/login",
    "/signup",
    "/health",
    "/api/health",
    "/favicon.ico",

    // reference data is public
    "/api/reference",
   "/api/reference/farms",
"/api/reference/crop-types",
"/api/reference/pests",
"/api/reference/diseases",
"/api/reference/crop-varieties"
]);


const STATIC_PREFIXES = [
    "/assets",
    "/css",
    "/js",
    "/images",
    "/fonts"
];


function isApi(req){

    return (
        req.path.startsWith("/api") ||
        req.path.startsWith("/scout-reports")
    );

}


function extractToken(req){

    if(req.cookies?.access_token){
        return req.cookies.access_token;
    }


    const header =
        req.headers.authorization;


    if(
        header &&
        header.startsWith("Bearer ")
    ){
        return header.substring(7);
    }


    return null;

}



module.exports = async function requireSiteAuth(
    req,
    res,
    next
){

    try{


        const path =
            req.path;



        if(PUBLIC_PATHS.has(path)){
            return next();
        }



        if(
            STATIC_PREFIXES.some(
                item =>
                path.startsWith(item)
            )
        ){

            return next();

        }



        if (path.startsWith("/auth")) {
            return next();
        }

        // API routes own their authentication.
        // report.routes.js uses auth.authenticate/auth.authorizeRoles,
        // while public reference routes are mounted before this middleware.
        // Resolving the token here as well creates a second authentication
        // pipeline and breaks tests/mocks and can produce duplicate 401/500s.
        if (isApi(req)) {
            return next();
        }

        const token =
            extractToken(req);



        if(!token){

            if(isApi(req)){

                return res.status(401).json({

                    success:false,

                    error:
                    "Authentication required"

                });

            }


            return res.redirect("/login");

        }



        if(
            typeof auth.getUserForToken !==
            "function"
        ){

            console.error(
                "Authentication resolver unavailable"
            );


            return res.status(500).json({

                success:false,

                error:
                "Authentication service unavailable"

            });

        }



        const result =
            await auth.getUserForToken(
                token
            );



        if(!result){

            return res.status(401).json({

                success:false,

                error:
                "Invalid session"

            });

        }



        req.user =
            result.user;



        req.session =
            result.session;



        next();


    }
    catch(error){

        console.error(
            "Authentication error:",
            error.message
        );


        if(isApi(req)){

            return res.status(401).json({

                success:false,

                error:
                "Invalid or expired session"

            });

        }


        res.redirect("/login");

    }

};