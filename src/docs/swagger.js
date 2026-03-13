const swaggerUi = require("swagger-ui-express");
const buildSwaggerSpec = require("./swaggerSpec");

const swaggerDocs = (app) => {
  const swaggerSpec = buildSwaggerSpec();

  app.use("/api/docs.json", (req, res) => {
    res.json(swaggerSpec);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Student Project Collaboration Platform API Docs"
    })
  );
};

module.exports = swaggerDocs;
