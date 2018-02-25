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
  target[type] = payload => ({
    type,
    payload,
    meta: {
      at: Date.now()
    }
  });

  return target;
}

export default function effex({ actions, context, disableSideEffects }) {
  let sideEffects = [];
  const actionCreators = Object.keys(actions).reduce(toActionCreator, {});

  const toEffectsReducer = reducer => (state, action) => {
    const next = reducer(state, action);
    const reduce = actions[action.type] || actions._;

    if (typeof reduce !== "function") {
      return next;
    }

    const array = reduce(next, action);

    if (!Array.isArray(array)) {
      const json = JSON.stringify(array, null, 2);

      console.error(
        `Expected action "${action.type}" to return an array but found ${json}`
      );

      return next;
    }

    const [model, ...effects] = array;

    sideEffects = sideEffects.concat(effects);

    return model;
  };

  return createStore => (reducer, preloadedState, enhancer) => {
    const effectsReducer = toEffectsReducer(reducer);
    const store = createStore(effectsReducer, preloadedState, enhancer);

    const createSideEffectProcessor = dispatcher => effects => {
      function process(effect) {
        return Promise.resolve(effect(actionCreators, context))
          .then(action => action && dispatcher(action))
          .catch(console.error);
      }

      if (disableSideEffects) {
        return Promise.resolve();
      }

      return Promise.all(effects.map(process));
    };

    function dispatch(action) {
      store.dispatch(action);

      const effectsToProcess = sideEffects;
      sideEffects = [];

      return createSideEffectProcessor(dispatch)(effectsToProcess);
    }

    function replaceReducer(reducer) {
      return store.replaceReducer(toEffectsReducer(reducer));
    }

    return {
      ...store,
      dispatch,
      replaceReducer,
      process: createSideEffectProcessor(dispatch)
    };
  };
}
