import gamesData from '@/data/games.json'
import { Game, Listing } from '@/types'

const englishGameNames: Record<string, string> = {
  ffxiv: 'Final Fantasy XIV',
  dqx: 'Dragon Quest X',
  bdo: 'Black Desert Online',
  wow: 'World of Warcraft',
  'monster-strike': 'Monster Strike',
  fgo: 'Fate/Grand Order',
  pazudora: 'Puzzle & Dragons',
  genshin: 'Genshin Impact',
  starrail: 'Honkai: Star Rail',
  toram: 'Toram Online',
  masterduel: 'Yu-Gi-Oh! Master Duel',
  pokemongo: 'Pokemon GO',
  lineagew: 'Lineage W',
  lostark: 'Lost Ark',
  valorant: 'VALORANT',
  lol: 'League of Legends',
  apex: 'Apex Legends',
  pubg: 'PUBG',
  cs2: 'Counter-Strike 2',
  rust: 'Rust',
  fortnite: 'Fortnite',
  maplestory: 'MapleStory',
  ragnarok: 'Ragnarok Online',
  bladeandsoul: 'Blade & Soul',
  albion: 'Albion Online',
  gw2: 'Guild Wars 2',
  newworld: 'New World',
  elsword: 'Elsword',
  tera: 'TERA',
  dota2: 'Dota 2',
  'gundam-online': 'Gundam Online',
  aion: 'Aion',
  'elden-ring': 'ELDEN RING',
  lifai: 'LIFAI',
  umamusume: 'Uma Musume: Pretty Derby',
  proseka: 'Project SEKAI',
  azurlane: 'Azur Lane',
  arknights: 'Arknights',
  bluearchive: 'Blue Archive',
  nikke: 'Goddess of Victory: NIKKE',
  dblegends: 'Dragon Ball Legends',
  'bounty-rush': 'One Piece Bounty Rush',
  'naruto-blazing': 'Naruto Blazing',
  'pubg-mobile': 'PUBG Mobile',
  codm: 'Call of Duty Mobile',
  freefire: 'Free Fire',
  coc: 'Clash of Clans',
  clashroyale: 'Clash Royale',
  brawlstars: 'Brawl Stars',
  mobilelegends: 'Mobile Legends',
  lordsmobile: 'Lords Mobile',
  shironeko: 'White Cat Project',
  blackwiz: 'Quiz RPG: Black Wizard',
  knivesout: 'Knives Out',
  reverse1999: 'Reverse: 1999',
  'wuthering-waves': 'Wuthering Waves',
  heavenburnred: 'Heaven Burns Red',
  gbf: 'Granblue Fantasy',
  bandori: 'BanG Dream! Girls Band Party!',
  'tales-rays': 'Tales of the Rays',
  shinycolors: 'The Idolmaster Shiny Colors',
  'romancing-saga': 'Romancing SaGa Re;univerSe',
  'taimanin-rpg': 'Taimanin RPG',
  mtga: 'Magic: The Gathering Arena',
  shadowverse: 'Shadowverse',
  dmplays: 'Duel Masters PLAYS',
  hearthstone: 'Hearthstone',
  splatoon3: 'Splatoon 3',
  'pokemon-sv': 'Pokemon Scarlet and Violet',
  nso: 'Nintendo Switch Online',
  mhnow: 'Monster Hunter Now',
}

const games = gamesData as Game[]
const gamesById = new Map(games.map((game) => [game.id, game]))

export function getCatalogGameName(game: Game) {
  return englishGameNames[game.slug] ?? game.name
}

function getGameById(gameId: number) {
  return gamesById.get(gameId)
}

export function getCatalogGameNameById(gameId: number) {
  const game = getGameById(gameId)
  return game ? getCatalogGameName(game) : ''
}

export function getCatalogListingTitle(listing: Listing) {
  const game = getGameById(listing.gameId)
  const gameName = game ? getCatalogGameName(game) : listing.gameName

  if (!game) return listing.title

  if (listing.id % 2 === 1) {
    if (game.category === 'mobile') return `${gameName} Top-Up Pack`
    if (game.category === 'other') return `${gameName} Starter Bundle`
    return `${gameName} Currency Pack`
  }

  return `${gameName} High Rank Account`
}

export function localizeGame(game: Game): Game {
  return {
    ...game,
    name: getCatalogGameName(game),
  }
}

export function localizeListing(listing: Listing): Listing {
  return {
    ...listing,
    gameName: getCatalogGameNameById(listing.gameId) || listing.gameName,
    title: getCatalogListingTitle(listing),
  }
}
