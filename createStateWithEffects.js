module.exports = function createStateWithEffects(value) {
  if (Array.isArray(value)) {
    if (typeof value[1] === "function") {
      return value;
    }
  }

  return [value];
};
