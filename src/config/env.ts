function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Falta la variable de entorno ${name}`,
        );
    }

    return value;
}

export const env = {
    l4d2: {
        host:
            process.env.L4D2_RCON_HOST ??
            "172.31.240.1",

        port: Number(
            process.env.L4D2_RCON_PORT ??
            27015,
        ),

        password: getRequiredEnv(
            "L4D2_RCON_PASSWORD",
        ),
    },

    actionQueue: {
        delayMs: Number(
            process.env.ACTION_QUEUE_DELAY_MS ??
            500,
        ),

        maxSize: Number(
            process.env.ACTION_QUEUE_MAX_SIZE ??
            100,
        ),
    },
};