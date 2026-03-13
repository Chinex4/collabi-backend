const mongoose = require("mongoose");

const createLookupSchema = (modelName, extraDefinition = {}) => {
  const schema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        unique: true
      },
      slug: {
        type: String,
        trim: true,
        unique: true
      },
      description: {
        type: String,
        trim: true,
        default: ""
      },
      isActive: {
        type: Boolean,
        default: true
      },
      ...extraDefinition
    },
    {
      timestamps: true
    }
  );

  schema.pre("validate", function generateSlug(next) {
    if (!this.slug && this.name) {
      this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    next();
  });

  return mongoose.models[modelName] || mongoose.model(modelName, schema);
};

module.exports = createLookupSchema;
