const express = require("express");

const createLookupController = require("../controllers/lookupController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const {
  createLookupValidator,
  updateLookupValidator,
  listLookupValidator,
  idLookupValidator
} = require("../validators/lookupValidator");

const buildLookupRouter = (Model, options) => {
  const router = express.Router();
  const controller = createLookupController(Model, options);

  router.get("/", listLookupValidator, validate, controller.list);
  router.get("/:id", idLookupValidator, validate, controller.getById);
  router.post("/", protect, authorize("admin"), createLookupValidator, validate, controller.create);
  router.patch("/:id", protect, authorize("admin"), updateLookupValidator, validate, controller.update);
  router.delete("/:id", protect, authorize("admin"), idLookupValidator, validate, controller.remove);

  return router;
};

module.exports = buildLookupRouter;
