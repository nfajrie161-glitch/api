
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { DefaultContext, rateLimit } from "elysia-rate-limit";
import { Logestic } from "logestic";
import { helmet } from "elysia-helmet";
import { HttpStatusCode } from "elysia-http-status-code";
import { ip } from "elysia-ip";

import type { SocketAddress } from "bun";
import type { Generator } from "elysia-rate-limit";

import { env } from "./utils/env";

const excludeRoutes = ["/", "/health", "/swagger"];

const ipGenerator: Generator<{ ip: SocketAddress }> = (
  _req: any,
  _serv: any,
  { ip }: any
) => {
  const ipValue = ip ?? "unknown";
  const hashedIP = Bun.hash(JSON.stringify(ipValue)).toString();

  return env.HASH_IP ? hashedIP : ipValue;
};

export const errorHandler = ({ code, httpStatus, error }: any) => {
  switch (code) {
    case "NOT_FOUND":
      return {
        code: httpStatus.HTTP_404_NOT_FOUND,
        message: error.message,
      };

    case "BAD_REQUEST":
      return {
        code: httpStatus.HTTP_400_BAD_REQUEST,
        message: error.message,
      };

    case "UNAUTHORIZED":
      return {
        code: httpStatus.HTTP_401_UNAUTHORIZED,
        message: error.message,
      };

    case "FORBIDDEN":
      return {
        code: httpStatus.HTTP_403_FORBIDDEN,
        message: error.message,
      };

    case "INTERNAL_SERVER_ERROR":
      return {
        code: httpStatus.HTTP_500_INTERNAL_SERVER_ERROR,
        message: error.message,
      };

    default:
      return {
        code: httpStatus.HTTP_500_INTERNAL_SERVER_ERROR,
        message: "Something went wrong",
      };
  }
};

export function setupMiddleware(app: Elysia) {
  return app
    .use(
      cors({
        origin: env.ALLOWED_HOSTS.split(","),
        preflight: true,
      })
    )
    .use(
      swagger({
        autoDarkMode: true,
        scalarVersion: "1.25.50",
        documentation: {
          info: {
            title: "AniVora API",
            description: "Anime API for AniVora.",
            version: "1.0.0",
          },
          tags: [
            {
              name: "v1",
              description: "API version 1",
            },
            {
              name: "v2",
              description: "API version 2",
            },
          ],
        },
        scalarConfig: {
          layout: "classic",
          spec: {
            url: "/swagger/json",
          },
          theme: "deepSpace",
        },
      })
    )
    .use(ip())
    .use(
      rateLimit({
        duration: Number(env.RATE_LIMIT_DURATION) || 60000,
        max: Number(env.RATE_LIMIT) || 80,
        headers: true,
        scoping: "global",
        context: new DefaultContext(8000),
        generator: ipGenerator,
        skip: (req) => {
          const pathname = new URL(req.url).pathname;

          if (
            excludeRoutes.some(
              (route) =>
                pathname === route ||
                pathname.startsWith(route + "/")
            )
          ) {
            return true;
          }

          if (
            env.ALLOWED_HOSTS.includes(
              req.headers?.get("host") ?? ""
            )
          ) {
            return true;
          }

          return false;
        },
      })
    )
    .use(
      helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            "script-src": [
              "'self'",
              "*",
              "https://cdn.jsdelivr.net",
            ],
          },
        },
      })
    )
    .use(Logestic.preset("fancy"))
    .use(HttpStatusCode())
    .onError(errorHandler);
}
