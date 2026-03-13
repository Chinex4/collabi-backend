const buildSearchRegex = (term) => ({
  $regex: term,
  $options: "i"
});

const buildSort = (sortBy, defaultSort = "-createdAt") => {
  if (!sortBy) return defaultSort;

  return sortBy
    .split(",")
    .map((value) => value.trim())
    .join(" ");
};

module.exports = {
  buildSearchRegex,
  buildSort
};
