import { readdir, rm } from "fs/promises";
import { inspect } from "util";
import { test } from "uvu";
import * as assert from "uvu/assert";

import { detect, getEnvironment, runAdder } from "svelte-add";
import { fresh as svelteKit } from "@svelte-add/create-kit/__init.js";
import { fresh as vite } from "@svelte-add/create-vite/__init.js";

const initializers = { svelteKit, vite };
const adders = await readdir("node_modules/svelte-add/adders");

for (const [app, init] of Object.entries(initializers)) {
	for (const adder of adders) {
		test(`${adder} being used on ${app} (without demos)`, async () => {
			const output = `_outputs/${app}_${adder}`;
			await rm(output, {
				recursive: true,
				force: true,
			});

			await init({
				demo: false,
				dir: output,
				eslint: false,
				packageManager: "pnpm",
				prettier: false,
				typescript: false,
			});

			let environment = await getEnvironment({ cwd: output });

			const preRunCheck = await detectAdder({
				adder,
				cwd: output,
				environment,
			});

			assert.ok(Object.values(preRunCheck).every((pass) => !pass), `Somehow, pre-run checks show that the integration is already set up: ${inspect(preRunCheck)}`);
			
			await runAdder({
				adder,
				cwd: output,
				environment,
				// TODO: fix so tests can be run on Windows
				npx: "pnpx",
				options: {},
			});

			environment = await getEnvironment({ cwd: output });

			const postRunCheck = await detectAdder({
				adder,
				cwd: output,
				environment,
			});

			assert.ok(Object.values(postRunCheck).every(Boolean), `The integration was not set up correctly: ${inspect(postRunCheck)}`);
		})
	}
}

test.run();
