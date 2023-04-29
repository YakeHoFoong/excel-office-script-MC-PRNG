module.exports =  {
    plugins: [
        "@typescript-eslint/eslint-plugin",
        "eslint-plugin-tsdoc",
        "office-addins"
    ],
    extends:  [
        "plugin:@typescript-eslint/recommended",
        "plugin:office-addins/recommended",
    ],
    parser:  '@typescript-eslint/parser',
    parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2018,
        sourceType: "module"
    },
    rules: {
        "tsdoc/syntax": "warn",
        "@typescript-eslint/no-namespace": "off"
    }
};