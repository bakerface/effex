function create(state, effects) {
  if (state && state._isStateWithSideEffects) {
    return {
      state: state.state,
      effects: state.effects.concat(effects),
      _isStateWithSideEffects: true
    };
  }

  return {
    state: state,
    effects: effects,
    _isStateWithSideEffects: true
  };
}

module.exports = function createStateWithEffects() {
  var effects = [].concat.apply([], arguments);
  var state = effects.shift();

  return create(state, effects);
};
