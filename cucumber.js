module.exports = {
  default: {
    requireModule: ["ts-node/register/transpile-only"],
    require: [
      "src/__tests__/bdd/steps/**/*.ts",
      "src/__tests__/bdd/support/**/*.ts"
    ],
    paths: ["src/__tests__/bdd/features/**/*.feature"],
    publishQuiet: true,
    format: [
      "progress",
      "summary",
      "html:src/__tests__/bdd/reports/cucumber-report.html"
    ],
    worldParameters: {}
  }
};