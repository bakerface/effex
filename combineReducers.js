var createStateWithEffects = require("./createStateWithEffects");

module.exports = function combineReducers(reducers) {
  function reducer(state = {}, action) {
    var effects = [];

    function reduce(next, key) {
      var value = reducers[key](state[key], action);
      var pair = createStateWithEffects(value);

      effects = effects.concat(pair.effects);
      next[key] = pair.state;

      return next;
    }

    var next = Object.keys(reducers).reduce(reduce, {});
    return createStateWithEffects(next, effects);
  }

  return reducer;
};
