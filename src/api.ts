// src/api.ts
import {
  generateTierData,
  generateMatches,
  type TierRow,
  type MatchItem,
} from './stats';

let _TIERS: TierRow[] | null = null;
let _MATCHES: MatchItem[] | null = null;

export async function loadAll(): Promise<{ tiers: TierRow[]; matches: MatchItem[] }> {
  if (!_TIERS) _TIERS = generateTierData();
  if (!_MATCHES) _MATCHES = generateMatches(_TIERS);
  return { tiers: _TIERS, matches: _MATCHES };
}
