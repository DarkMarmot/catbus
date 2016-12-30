import node from "rollup-plugin-node-resolve";

export default {
        entry: "src/catbus.js",
        format: "es",
        moduleName: "catbus",
        plugins: [node()],
        dest: "dist/catbus.js"
};
