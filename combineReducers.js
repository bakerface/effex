var createStateWithEffects = require("./createStateWithEffects");

module.exports = function combineReducers(reducers) {
  function reducer(state = {}, action) {
    var effects = [];

    function reduce(next, key) {
      var value = reducers[key](state[key], action);
      var enhancedState = createStateWithEffects(value);
      var substate = enhancedState[0];

      effects = effects.concat(enhancedState.slice(1));
      next[key] = substate;

      return next;
    }

    var next = Object.keys(reducers).reduce(reduce, {});

    if (effects.length > 0) {
      return [next].concat(effects);
    }

    return next;
  }

  return reducer;
};
