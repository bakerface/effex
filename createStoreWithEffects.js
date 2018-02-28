var createStateWithEffects = require("./createStateWithEffects");

module.exports = function createStoreWithEffects() {
  var sideEffects = [];

  function enhance(createStore) {
    function createEnhancedReducer(reducer) {
      function reduce(state, action) {
        var value = reducer(state, action);
        var pair = createStateWithEffects(value);

        sideEffects = sideEffects.concat(pair.effects);
        return pair.state;
      }

      return reduce;
    }

    function createEffectProcessor(dispatch) {
      function processOne(effect) {
        return Promise.resolve(effect())
          .then(function (action) {
            return action && dispatch(action);
          });
      }

      function process(effects) {
        var promises = effects.map(processOne);
        return Promise.all(promises);
      }

      return process;
    }

    function createEnhancedStore(reducer, preloadedState, enhancer) {
      var enhancedReducer = createEnhancedReducer(reducer);
      var store = createStore(enhancedReducer, preloadedState, enhancer);
      var _dispatch = store.dispatch;
      var _replaceReducer = store.replaceReducer;

      function dispatch(action) {
        _dispatch(action);

        var effects = sideEffects;
        sideEffects = [];

        return createEffectProcessor(dispatch)(effects);
      }

      function replaceReducer(reducer) {
        return _replaceReducer(createEnhancedReducer(reducer));
      }

      store.dispatch = dispatch;
      store.replaceReducer = replaceReducer;

      return store;
    }

    return createEnhancedStore;
  }

  return enhance;
};
