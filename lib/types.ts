/**
 * Tipos base de dados do Lendas.
 *
 * Idioma: por enquanto tudo em português (posições, labels, etc.).
 * A estrutura está preparada para futuramente aceitar outros idiomas,
 * mas o MVP usa exclusivamente os códigos de posição em português.
 */

/** Códigos de posição em português usados em todo o jogo. */
export type PlayerPosition =
  | "GOL"
  | "ZAG"
  | "LE"
  | "LD"
  | "VOL"
  | "MC"
  | "MEI"
  | "PE"
  | "PD"
  | "SA"
  | "CA";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export type TournamentType = "international" | "national" | "continental" | "friendly";

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  type: TournamentType | string;
  is_active: boolean;
  created_at: string;
}

export interface Squad {
  id: string;
  tournament_id: string;
  country_code: string;
  country_name: string;
  year: number;
  display_name: string;
  overall: number;
  created_at: string;
}

export interface Player {
  id: string;
  squad_id: string;
  first_name: string;
  full_name: string;
  number: number;
  position: PlayerPosition;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  set_piece: number;
  penalty: number;
  created_at: string;
}

export interface UserSquad {
  id: string;
  user_id: string;
  tournament_id: string;
  formation: string;
  play_style: string;
  average_overall: number;
  created_at: string;
}

export interface UserSquadPlayer {
  id: string;
  user_squad_id: string;
  player_id: string;
  slot_position: PlayerPosition;
  created_at: string;
}

export type MatchEventType =
  | "kickoff"
  | "pass"
  | "shot"
  | "save"
  | "foul"
  | "penalty"
  | "free_kick"
  | "goal"
  | "halftime"
  | "fulltime";

export type SetPieceOutcome = "goal" | "miss" | "save" | "post";

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  team: "user" | "opponent" | "none";
  player_name?: string;
  player_number?: number;
  description: string;
  x: number;
  y: number;
  target_x: number;
  target_y: number;
  is_goal: boolean;
  // Eventos interativos (pênalti / falta a favor do usuário)
  interactive?: boolean;
  requires_choice?: boolean;
  choice_type?: "penalty_taker" | "free_kick_taker";
  resolved?: boolean;
  chosen_player_id?: string;
  chosen_player_name?: string;
  outcome?: SetPieceOutcome;
}

export interface MatchStats {
  [key: string]: number | string;
}

export type CampaignStage =
  | "grupos"
  | "oitavas"
  | "quartas"
  | "semi"
  | "final"
  | "encerrada";

export type CampaignStatus = "active" | "eliminated" | "champion" | "completed";

export interface Match {
  id: string;
  user_id: string;
  user_squad_id: string;
  tournament_id: string;
  opponent_squad_id: string | null;
  user_score: number;
  opponent_score: number;
  user_won: boolean;
  match_events: MatchEvent[];
  stats: MatchStats;
  campaign_run_id: string | null;
  stage: CampaignStage | string | null;
  match_order: number | null;
  is_knockout: boolean;
  created_at: string;
}

export interface GroupResult {
  home: string;
  away: string;
  home_score: number;
  away_score: number;
}

export interface CampaignBracket {
  group_opponents?: string[];
  group_results?: GroupResult[];
}

export interface CampaignRun {
  id: string;
  user_id: string;
  tournament_id: string;
  user_squad_id: string;
  status: CampaignStatus;
  current_stage: CampaignStage;
  group_points: number;
  group_wins: number;
  group_draws: number;
  group_losses: number;
  goals_for: number;
  goals_against: number;
  group_table: GroupTableRow[];
  bracket: CampaignBracket;
  ranking_applied: boolean;
  completed_at: string | null;
  public_share_id: string | null;
  is_public: boolean;
  shared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignShareData {
  playerName: string;
  statusSeal: string;
  resultLabel: string;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  averageOverall: number;
  topPlayers: {
    first_name: string;
    position: string;
    number: number;
    overall: number;
  }[];
  phrase: string;
  rankingPosition: number | null;
}

export interface GroupTableRow {
  squad_id: string | null;
  name: string;
  code: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  is_user: boolean;
}

export interface CampaignWithMatches extends CampaignRun {
  matches: Match[];
}

export interface UserSquadPlayerWithPlayer extends UserSquadPlayer {
  player: Player;
}

export interface UserSquadWithPlayers extends UserSquad {
  players: UserSquadPlayerWithPlayer[];
}

export interface MatchWithRelations extends Match {
  user_squad: UserSquadWithPlayers | null;
  opponent_squad: Squad | null;
}

export interface RankingEntry {
  id: string;
  user_id: string;
  tournament_id: string;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  best_overall: number;
  campaigns_played: number;
  championships: number;
  best_campaign_wins: number;
  best_goal_difference: number;
  updated_at: string;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  display_name: string | null;
}

export type FeedbackType = "feedback" | "bug" | "idea";
export type FeedbackStatus = "new" | "read" | "in_review" | "resolved" | "ignored";
export type FeedbackPriority = "low" | "normal" | "high" | "urgent";

export interface FeedbackReport {
  id: string;
  user_id: string | null;
  type: FeedbackType | string;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  admin_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}
