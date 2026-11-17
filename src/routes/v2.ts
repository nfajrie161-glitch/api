
import { Elysia, t } from "elysia";
import { META } from "@consumet/extensions";

import v2 from "../modules/v2";
import { extract } from "../utils/gogostream";
import { base64encode } from "../utils/base64";
import { SeasonList } from "../types/v1";

const meta = new META.Anilist();

export const v2Routes = (app: Elysia) => {
  app.group("/api/v2", (app) =>
    app
      .get(
        "/info/:id",
        async ({ params, set }) => {
          try {
            const data = await v2.AnimeInfo(Number(params.id));
            return { code: 200, message: "success", ...data };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          params: t.Object({ id: t.String() }),
          tags: ["v2"],
          detail: { description: "Get anime info from Anilist with provider" },
        }
      )

      .get(
        "/recommendations/:id",
        async ({ params, query, set }) => {
          try {
            const data = await v2.SimilarAnime(
              Number(params.id),
              Number(query.page || 1),
              Number(query.limit || 12)
            );
            return { code: 200, message: "success", ...data };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          params: t.Object({ id: t.String() }),
          query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String()),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/trending",
        async ({ query, set }) => {
          try {
            const data = await v2.Trending(
              Number(query.p || 1),
              Number(query.limit || 20)
            );
            return {
              code: 200,
              message: "success",
              page: data.pageInfo,
              results: data.results,
            };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          query: t.Object({
            p: t.Optional(t.String()),
            limit: t.Optional(t.String()),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/popular",
        async ({ query, set }) => {
          try {
            const data = await v2.Popular(
              Number(query.p || 1),
              Number(query.limit || 20)
            );
            return {
              code: 200,
              message: "success",
              page: data.pageInfo,
              results: data.results,
            };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          query: t.Object({
            p: t.Optional(t.String()),
            limit: t.Optional(t.String()),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/season/:season/:year",
        async ({ params, query, set }) => {
          try {
            const data = await v2.Season(
              params.season.toUpperCase() as SeasonList,
              Number(params.year),
              Number(query.p || 1),
              Number(query.limit || 20)
            );
            return {
              code: 200,
              message: "success",
              page: data.pageInfo,
              results: data.results,
            };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          params: t.Object({
            season: t.Enum({
              WINTER: "winter",
              SPRING: "spring",
              SUMMER: "summer",
              FALL: "fall",
            }),
            year: t.String(),
          }),
          query: t.Object({
            p: t.Optional(t.String()),
            limit: t.Optional(t.String()),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/episodes/:id",
        async ({ params, query, set }) => {
          try {
            const data = await meta.fetchEpisodesListById(
              params.id,
              query.dub === "true",
              query.getFiller === "true"
            );
            return { code: 200, message: "success", results: data };
          } catch (error: any) {
            set.status = 500;
            return { code: 500, message: error.message || "error" };
          }
        },
        {
          params: t.Object({ id: t.String() }),
          query: t.Object({
            dub: t.Optional(t.String()),
            getFiller: t.Optional(t.String()),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/stream/:id/:ep",
        async ({ params, set }) => {
          try {
            const data = await extract(`${params.id}-episode-${params.ep}`);

            if (data.code === 404 || !data.sources?.length) {
              set.status = 404;
              return { code: 404, message: "Not Found" };
            }

            const main = data.sources.find((item: any) => item.quality === "default") || data.sources[0];
            const backup = data.sources.find((item: any) => item.quality === "backup") || null;
            const tracks = data.tracks?.[0] || null;

            return {
              info: data.info,
              stream: {
                multi: { main, backup },
                tracks,
              },
              iframe: data.iframe,
              plyr: {
                main: main?.url ? `https://plyr.link/p/player.html#${base64encode(main.url)}` : null,
                backup: backup?.url ? `https://plyr.link/p/player.html#${base64encode(backup.url)}` : null,
              },
              nspl: {
                main: main?.url ? `https://nspl.nyt92.eu.org/player?p=${base64encode(`&title=${params.id}&file=${main.url}&thumbnails=${tracks?.file || ""}`)}` : null,
                backup: backup?.url ? `https://nspl.nyt92.eu.org/player?p=${base64encode(`&title=${params.id}&file=${backup.url}&thumbnails=${tracks?.file || ""}`)}` : null,
              },
            };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          params: t.Object({
            id: t.String(),
            ep: t.String(),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/stream/skiptimes/:id/:ep",
        async ({ params, set }) => {
          try {
            const data = await v2.AniSkipData(params.id, params.ep);
            return { code: 200, results: data };
          } catch (error: any) {
            set.status = error.code || 500;
            return { code: error.code || 500, message: error.message || "error" };
          }
        },
        {
          params: t.Object({
            id: t.String(),
            ep: t.String(),
          }),
          tags: ["v2"],
        }
      )

      .get(
        "/search",
        async ({ query, set }) => {
          try {
            const data = await v2.AnimeSearch(
              query.q,
              Number(query.p || 1),
              Number(query.limit || 20)
            );

            if (data.code) {
              set.status = data.code;
              return data;
            }

            return {
              code: 200,
              message: "success",
              page: data.pageInfo,
              results: data.results,
            };
          } catch (error: any) {
            set.status = 500;
            return { code: 500, message: error.message || "Search failed" };
          }
        },
        {
          query: t.Object({
            q: t.String({ description: "Search query" }),
            p: t.Optional(t.String({ description: "Page number" })),
            limit: t.Optional(t.String({ description: "Number of results per page" })),
          }),
          tags: ["v2"],
          detail: { description: "Search anime with Anilist" },
        }
      )

      .post(
        "/search",
        async ({ body, set }) => {
          try {
            const data = await v2.AnimeAdvancedSearch(body);

            if (data.code) {
              set.status = data.code;
              return data;
            }

            return {
              code: 200,
              message: "success",
              page: data.pageInfo,
              results: data.results,
            };
          } catch (error: any) {
            set.status = 500;
            return { code: 500, message: error.message || "Advanced search failed" };
          }
        },
        {
          body: t.Object({
            search: t.String(),
            id: t.Optional(t.String()),
            type: t.Optional(t.String()),
            size: t.Optional(t.Number()),
            page: t.Optional(t.Number()),
            nsfw: t.Optional(t.Boolean()),
            genres: t.Optional(t.Array(t.String())),
            tags: t.Optional(t.Array(t.String())),
            sort: t.Optional(t.Array(t.String())),
            format: t.Optional(t.Array(t.String())),
            status: t.Optional(t.String()),
            countryOfOrigin: t.Optional(t.String()),
            source: t.Optional(t.String()),
            season: t.Optional(t.String()),
            seasonYear: t.Optional(t.Number()),
            year: t.Optional(t.String()),
          }),
          tags: ["v2"],
          detail: { description: "Advanced anime search with Anilist" },
        }
      )
  );
};
