/**
 * Copyright (c) 2018 Chris Baker <mail.chris.baker@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

function toActionCreator(target, type) {
  target[type] = function (payload) {
    return {
      type: type,
      payload: payload,
      meta: {
        at: Date.now()
      }
    };
  };

  return target;
}

module.exports = function effex(options) {
  var actions = options.actions;
  var context = options.context;
  var disableSideEffects = options.disableSideEffects;
  var sideEffects = [];
  var actionCreators = Object.keys(actions).reduce(toActionCreator, {});

  function toEffectsReducer(reducer) {
    return function (state, action) {
      var next = reducer(state, action);
      var reduce = actions[action.type] || actions._;

      if (typeof reduce !== "function") {
        return next;
      }

      var array = reduce(next, action);

      if (!Array.isArray(array)) {
        var json = JSON.stringify(array, null, 2);

        console.error(
          'Expected action "' + action.type +
          '" to return an array but found "' + json + '"'
        );

        return next;
      }

      var model = array[0];
      var effects = array.slice(1);

      sideEffects = sideEffects.concat(effects);

      return model;
    };
  }

  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var effectsReducer = toEffectsReducer(reducer);
      var store = createStore(effectsReducer, preloadedState, enhancer);

      function createSideEffectProcessor(dispatcher) {
        return function (effects) {
          function process(effect) {
            return Promise.resolve(effect(actionCreators, context))
              .then(function (action) {
                return action && dispatcher(action);
              })
              .catch(console.error);
          }

          if (disableSideEffects) {
            return Promise.resolve();
          }

          return Promise.all(effects.map(process));
        };
      }

      function dispatch(action) {
        store.dispatch(action);

        var effectsToProcess = sideEffects;
        sideEffects = [];

        return createSideEffectProcessor(dispatch)(effectsToProcess);
      }

      function replaceReducer(reducer) {
        return store.replaceReducer(toEffectsReducer(reducer));
      }

      var storeWithEffects = Object.assign({ }, store, {
        dispatch: dispatch,
        replaceReducer: replaceReducer,
        process: createSideEffectProcessor(dispatch)
      });

      return storeWithEffects;
    };
  };
}
