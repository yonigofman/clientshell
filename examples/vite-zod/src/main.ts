import { readEnvWithZod } from "@clientshell/zod";
import { clientEnvSchema } from "./env.schema";

const clientEnv = readEnvWithZod(clientEnvSchema);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 2rem;">
    <h1>clientshell — vite-zod</h1>
    <p>Runtime config loaded with <strong>Zod validation</strong>:</p>
    <pre style="background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto;">${JSON.stringify(clientEnv, null, 2)}</pre>
    <ul>
      <li><strong>API_URL:</strong> ${clientEnv.API_URL}</li>
      <li><strong>APP_ENV:</strong> ${clientEnv.APP_ENV}</li>
      <li><strong>ENABLE_NEW_UI:</strong> ${clientEnv.ENABLE_NEW_UI}</li>
      <li><strong>POLL_INTERVAL_MS:</strong> ${clientEnv.POLL_INTERVAL_MS}</li>
      <li><strong>PUBLIC_FLAGS:</strong> ${JSON.stringify(clientEnv.PUBLIC_FLAGS)}</li>
    </ul>
  </div>
`;
