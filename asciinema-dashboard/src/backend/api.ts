import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as trpcExpress from '@trpc/server/adapters/express';
import { getSession } from '@auth/express';
import { authConfig } from './auth.config.js';
import { TOTP } from "totp-generator"
import { base32Encode } from '@ctrl/ts-base32';
import { ENV } from './env.config.js';
import { GitHubProfile } from '@auth/express/providers/github';
import { acceptedUserManager, pendingUserManager, UserManager } from './redis.js';

// created for each request
const createContext = async ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => {
    const session = await getSession(req, authConfig)
    let username: string | null | undefined = null;
    if (session) {
        username = session?.user?.email?.split('@')[0]
        // attempt to convert to github session
        const githubSession = (session as unknown as GitHubProfile)
        if (githubSession.login) {
            username = githubSession.login
        }
    }
    return { username }
};
type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create();

export const protectedProcedure = t.procedure.use(function isAuthed(opts) {
    const username = opts.ctx.username
    if (!username) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
      });
    }

    return opts.next({
      ctx: {
        user: username,
      },
    });
  });


const enc = new TextEncoder(); // always utf-8
export const apiRouter = t.router({
    getTotp: protectedProcedure.query((opts) => {
        const { username } = opts.ctx
        const totp = TOTP.generate(base32Encode(enc.encode(username + ENV.JWT_SECRET), 'RFC4648'), {
            algorithm: "SHA-256"
          })
          console.log(totp)
        return totp;
    }),
    getUsername: protectedProcedure.query((opts) => {
        const { username } = opts.ctx
        return username;
    }),
    createUser: protectedProcedure.input(z.object({
        username: z.string(),
        group: z.string(),
    })).mutation(({ input, ctx } ) => {
        let manager: UserManager
        if (ctx.username && ctx.username in ENV.ADMINS) {
          manager = acceptedUserManager
        } else {
          manager = pendingUserManager
        }
        manager.addUser(input.group, input.username)
    }),
    deleteUser: protectedProcedure.input(z.object({
        username: z.string(),
        group: z.string(),
    })).mutation(({ input, ctx } ) => {
        let manager: UserManager
        if (ctx.username && ctx.username in ENV.ADMINS) {
          manager = acceptedUserManager
        } else {
          manager = pendingUserManager
        }
        manager.deleteUser(input.group, input.username)
    }),
    listUsers: protectedProcedure.input(z.object({
        group: z.string()
    })).query(({input, ctx}) => {
        if (ctx.username && ctx.username in ENV.ADMINS) {
            return acceptedUserManager.listUsers(input.group)
        }
    })
});
// export type definition of API
export type ApiRouter = typeof apiRouter;

export const trpcApi = trpcExpress.createExpressMiddleware({
    router: apiRouter,
    createContext,
})