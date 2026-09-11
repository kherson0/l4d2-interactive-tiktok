import type { L4D2Client } from "../../conectors/l4d2/l4d2.client.js";

export type DonorStat = {
    name: string;
    spawns: number;
    damage: number;
};

const STATS_PREFIX = "[Interactive][STATS]";

/** Ranking de la partida en curso, ordenado por daño infligido. */
export async function readDonorStats(
    l4d2: L4D2Client,
): Promise<DonorStat[]> {
    const response = await l4d2.sendCommand("sm_interactive_stats");

    const line = response
        .split("\n")
        .find((it) => it.includes(STATS_PREFIX));

    if (!line) {
        throw new Error(
            `Respuesta inesperada de sm_interactive_stats: ${response.trim()}`,
        );
    }

    const json = line.slice(
        line.indexOf(STATS_PREFIX) + STATS_PREFIX.length,
    );

    const parsed = JSON.parse(json) as { donors: DonorStat[] };

    return parsed.donors.sort((a, b) => b.damage - a.damage);
}

/** Texto de créditos para el final de la misión. */
export function formatCredits(donors: DonorStat[]): string {
    if (donors.length === 0) {
        return "Nadie generó caos esta partida.";
    }

    const lines = donors.map(
        (donor, index) =>
            `${index + 1}. ${donor.name} — ${donor.damage} de daño, ${donor.spawns} infectados`,
    );

    return lines.join("\n");
}
