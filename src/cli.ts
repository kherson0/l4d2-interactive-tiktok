import "dotenv/config";

import { createApp } from "./app/app.js";
import { giftRules } from "./core/rules/gift-rules.js";

import {
    formatCredits,
    readDonorStats,
} from "./core/stats/donor-stats.js";

// Manual test bench: fires events through the real pipeline (rules -> queue
// -> RCON) so the only untested piece left is TikTok itself.
//
//   pnpm event gift rose 3 Jerson
//   pnpm event cmd sm_interactive_test
//   pnpm event gifts

function usage(): void {
    console.log(
        [
            "Uso:",
            "  pnpm event effect <efecto> [intensidad] [donante]",
            "  pnpm event gift <regalo> [cantidad] [usuario]",
            "  pnpm event cmd <comando rcon...>",
            "  pnpm event stats",
            "  pnpm event gifts",
            "",
            "Efectos: heal ignite | smoker boomer hunter spitter jockey charger witch tank",
            "",
            "Regalos disponibles: " +
            giftRules.map((rule) => rule.gift).join(", "),
        ].join("\n"),
    );
}

async function main(): Promise<void> {
    const [mode, ...rest] = process.argv.slice(2);

    if (mode === "gifts") {
        for (const rule of giftRules) {
            console.log(
                `${rule.gift} -> ${JSON.stringify(rule.action)} (máx ${rule.maxPerEvent})`,
            );
        }

        return;
    }

    if (mode !== "stats" && (!mode || rest.length === 0)) {
        usage();

        process.exitCode = 1;

        return;
    }

    const { l4d2, eventHandler } = createApp();

    await l4d2.connect();

    if (mode === "stats") {
        const donors = await readDonorStats(l4d2);

        console.log(formatCredits(donors));
    } else if (mode === "effect") {
        const [effect, intensityArg, donor] = rest;

        await l4d2.runEffect(
            effect!,
            Number(intensityArg ?? 1),
            donor ? { user: donor, gift: "manual" } : undefined,
        );
    } else if (mode === "cmd") {
        const response = await l4d2.sendCommand(rest.join(" "));

        console.log(`[Respuesta] ${response.trim() || "(vacía)"}`);
    } else if (mode === "gift") {
        const [gift, amountArg, user] = rest;

        await eventHandler.handle({
            type: "gift",
            user: user ?? "tester",
            gift: gift!,
            amount: Number(amountArg ?? 1),
        });

        // The queue runs in the background: give it room before closing.
        await new Promise((resolve) => setTimeout(resolve, 3_000));
    } else {
        usage();

        process.exitCode = 1;
    }

    await l4d2.disconnect();
}

main().catch((error) => {
    console.error("[CLI] Error:", error);

    process.exit(1);
});
