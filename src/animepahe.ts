
import { ANIME } from "@consumet/extensions";

const animePahe = new ANIME.AnimePahe();

export const searchAnime = async (query: string) => {
  return await animePahe.search(query);
};

export const getAnimeInfo = async (id: string) => {
  return await animePahe.fetchAnimeInfo(id);
};

export const getEpisodeSources = async (episodeId: string) => {
  return await animePahe.fetchEpisodeSources(episodeId);
};

export default {
  searchAnime,
  getAnimeInfo,
  getEpisodeSources,
};
