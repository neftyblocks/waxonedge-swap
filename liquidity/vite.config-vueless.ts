import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag.includes("waxonedge-"),
                },
            },
        }),
    ],
    build: {
        minify: "esbuild",
        emptyOutDir: false,
        rollupOptions: {
            external: ["vue"],
        },
        lib: {
            entry: "./src/main.ce.ts",
            name: "vueless",
            formats: ["es", "cjs"],
            fileName: (format) => `vueless.${format === "es" ? "mjs" : "cjs"}`,
        },
    },
});
