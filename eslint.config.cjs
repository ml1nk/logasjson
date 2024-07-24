module.exports = [
    {
        ...require('eslint-config-love'),
        files: ['**/*.js', '**/*.ts'],
        ignores: ["**/dist/**"],
    },
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/class-methods-use-this": "off"
        }
    }
]