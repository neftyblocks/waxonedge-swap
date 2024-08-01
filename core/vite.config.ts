import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        minify: "esbuild",
        lib: {
            entry: "./src/index.ts",
            name: "WaxOnEdgeCore",
            fileName: "waxonedge-core",
            formats: ["es", "umd", "cjs"],
        },
        rollupOptions: {
            external: ["vue", "@nefty/use"],
            output: {
                globals: {
                    vue: "Vue",
                },
            },
        },
    },
});
