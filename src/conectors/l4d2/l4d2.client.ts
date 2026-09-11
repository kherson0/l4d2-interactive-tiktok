import { Rcon } from "rcon-client";
import type { InfectedType } from "./infected.type.js";

export class L4D2Client {
    private rcon?: Rcon;

    constructor(
        private readonly host: string,
        private readonly port: number,
        private readonly password: string,
    ) { }

    async connect() {
        if (this.rcon) {
            return;
        }

        this.rcon = await Rcon.connect({
            host: this.host,
            port: this.port,
            password: this.password,
        });

        console.log(`[L4D2] Conectado a ${this.host}:${this.port}`);
    }

    async disconnect() {
        if (!this.rcon) {
            return;
        }

        this.rcon.end();
        this.rcon = undefined;

        console.log("[L4D2] Desconectado");
    }

    async sendCommand(command: string) {
        if (!this.rcon) {
            throw new Error("No hay conexión RCON activa");
        }

        return this.rcon.send(command);
    }

    async spawnInfected(
        type: InfectedType,
        amount = 1,
    ): Promise<string> {
        if (amount < 1) {
            throw new Error(
                "La cantidad debe ser mayor a 0",
            );
        }

        const command =
            `sm_spawn_infected ${type} ${amount}`;

        console.log(
            `[L4D2] Ejecutando: ${command}`,
        );

        const response = await this.sendCommand(
            command,
        );

        if (
            response.includes(
                "[Interactive][ERROR]",
            )
        ) {
            throw new Error(response.trim());
        }

        return response;
    }
}