import { daoRouter } from "./router/dao";
import { moduleRouter } from "./router/module";
import { proposalCommentRouter } from "./router/proposal-comment";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  dao: daoRouter,
  module: moduleRouter,
  proposalComment: proposalCommentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
