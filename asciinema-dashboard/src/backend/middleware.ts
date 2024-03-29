import { getSession } from "@auth/express"
import { NextFunction, Request, Response } from "express"
import { authConfig } from "./auth.config.js"

export async function authenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = res.locals.session ?? (await getSession(req, authConfig))
  
  if (session) {
    console.log("authenticated", req.path)
    res.locals.session = session
    return next()
  } else if (!req.path.startsWith("/auth/") && req.path != "/favicon.ico") {
    console.log("unauthenticated", req.path)
    res.redirect("/auth/signin")
  } else {
    console.log("allowed for auth", req.path)
  }
}

export async function useSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = res.locals.session ?? (await getSession(req, authConfig))
  
  if (session) {
    res.locals.session = session
    return next()
  } else {
    return next()
  }
}