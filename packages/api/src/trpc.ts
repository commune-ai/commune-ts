/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@commune-ts/db/client";

import { decodeJwtSessionToken } from "./jwt";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = (opts: {
  headers: Headers;
  session: null;
  jwtSecret: string;
}) => {
  const { jwtSecret } = opts;

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  console.log(">>> tRPC Request from", source);

  const [authType, authToken] = (
    opts.headers.get("authorization") ??
    opts.headers.get("Authorization") ??
    ""
  ).split(" ");

  let user: { userKey: string } | null = null;
  if (authToken) {
    try {
      user = decodeJwtSessionToken(authToken, jwtSecret);
      // TODO: verify JWT
    } catch (err) {
      console.error("Failed to decode JWT", err);
    }
  }

  return {
    db,
    authType,
    user,
    jwtSecret,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and sub routers in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure
 *
 * This is a procedure that requires authentication to be accessed.
 * header: { Authorization: "Bearer <token>" }
 *
 * if the token is valid, the user will always be available in the context as `ctx.user`.
 *
 * If the token is invalid, expired, or the user is not found, it will throw an error.
 */
export const authenticatedProcedure = t.procedure.use(
  async function isAuthenticated(opts) {
    if (!opts.ctx.authType) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must have an active session",
      });
    }
    if (opts.ctx.authType !== "Bearer") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or unsupported authentication type",
      });
    }
    if (!opts.ctx.user?.userKey) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
    return opts.next(opts);
  },
);
