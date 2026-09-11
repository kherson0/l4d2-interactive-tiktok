import "dotenv/config";

import { startApp } from "./app/app.js";

startApp().catch((error) => {
    console.error(
        "[Interactive App] Error:",
        error,
    );

    process.exit(1);
});