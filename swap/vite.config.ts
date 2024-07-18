import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag.includes("waxonedge-swap"),
                },
            },
        }),
    ],
    build: {
        minify: "esbuild",
        lib: {
            entry: "./src/main.ce.ts",
            name: "main",
            formats: ["es", "cjs"],
            fileName: (format) => `main.${format === "es" ? "mjs" : "cjs"}`,
        },
    },
});
