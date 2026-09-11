import { Rcon } from "rcon-client";
import type { InfectedType } from "./infected.type.js";

/** El efecto no llegó a ocurrir porque la partida no estaba activa. */
export class EffectSkipped extends Error { }

export class L4D2Client {
    private rcon?: Rcon;

    private connecting?: Promise<void>;

    constructor(
        private readonly host: string,
        private readonly port: number,
        private readonly password: string,
    ) { }

    async connect(): Promise<void> {
        if (this.rcon) {
            return;
        }

        // ponytail: one in-flight connect shared by concurrent callers
        this.connecting ??= this
            .openConnection()
            .finally(() => {
                this.connecting = undefined;
            });

        return this.connecting;
    }

    private async openConnection(): Promise<void> {
        const rcon = await Rcon.connect({
            host: this.host,
            port: this.port,
            password: this.password,
        });

        // The server drops RCON on changelevel, restart or crash.
        // Clearing the reference makes the next command reconnect.
        rcon.on("end", () => {
            this.handleDrop(rcon, "conexión cerrada por el servidor");
        });

        rcon.on("error", (error) => {
            this.handleDrop(rcon, `error de socket: ${error}`);
        });

        this.rcon = rcon;

        console.log(`[L4D2] Conectado a ${this.host}:${this.port}`);
    }

    private handleDrop(rcon: Rcon, reason: string): void {
        if (this.rcon !== rcon) {
            return;
        }

        this.rcon = undefined;

        console.warn(
            `[L4D2] Conexión perdida (${reason}). Se reconectará al próximo comando.`,
        );

        void rcon.end().catch(() => { });
    }

    async disconnect(): Promise<void> {
        const rcon = this.rcon;

        if (!rcon) {
            return;
        }

        this.rcon = undefined;

        await rcon.end().catch(() => { });

        console.log("[L4D2] Desconectado");
    }

    async sendCommand(command: string): Promise<string> {
        await this.connect();

        const rcon = this.rcon;

        if (!rcon) {
            throw new Error("No hay conexión RCON activa");
        }

        try {
            return await rcon.send(command);
        } catch (error) {
            this.handleDrop(rcon, "fallo al enviar comando");

            throw error;
        }
    }

    async runEffect(
        effect: string,
        intensity: number,
        source?: { user: string; gift?: string },
    ): Promise<string> {
        if (intensity < 1) {
            throw new Error(
                "La intensidad debe ser mayor a 0",
            );
        }

        const args = [
            effect,
            String(intensity),
        ];

        if (source) {
            args.push(quoteArg(source.user));
            args.push(quoteArg(source.gift ?? ""));
        }

        const command = `sm_interactive ${args.join(" ")}`;

        console.log(`[L4D2] Ejecutando: ${command}`);

        const response = await this.sendCommand(command);

        // El server rechaza efectos fuera de partida: no es un fallo, no se
        // reintenta y no consume el cooldown.
        if (response.includes("[Interactive][SKIP]")) {
            throw new EffectSkipped(response.trim());
        }

        if (response.includes("[Interactive][ERROR]")) {
            throw new Error(response.trim());
        }

        return response;
    }
}

// Nicknames and gift names come from TikTok and end up inside an RCON
// command line, where a quote or a semicolon would run arbitrary commands.
// Only safe characters survive.
export function quoteArg(value: string): string {
    const safe = value
        .replace(/[^\p{L}\p{N} ._-]/gu, "")
        .trim()
        .slice(0, 24);

    return `"${safe}"`;
}
