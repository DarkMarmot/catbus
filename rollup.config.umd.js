import node from "rollup-plugin-node-resolve";

export default {
        entry: "src/catbus.js",
        format: "umd",
        moduleName: "catbus",
        plugins: [node()],
        dest: "dist/catbus.umd.js"
};
