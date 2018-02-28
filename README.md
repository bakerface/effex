# effex
[![npm package](https://badge.fury.io/js/effex.svg)](http://badge.fury.io/js/effex)
[![downloads](http://img.shields.io/npm/dm/effex.svg)](https://www.npmjs.com/package/effex)
[![dependencies](https://david-dm.org/bakerface/effex.svg)](https://david-dm.org/bakerface/effex)
[![devDependencies](https://david-dm.org/bakerface/effex/dev-status.svg)](https://david-dm.org/bakerface/effex#info=devDependencies)

This package allows you to easily describe side effects in your reducer, rather than middleware.
This allows you to pass local reducer state to your side effects.

``` javascript
import { createStore, compose, applyMiddleware } from "redux";
import { combineReducers, createStoreWithEffects } from "effex";
import * as reducers from "./reducers";
import middleware from "./middleware";

// create side-effect aware reducer
const reducer = combineReducers(reducers);

// create side-effect aware store
const enhancer = compose(
  applyMiddleware(middleware),
  createStoreWithEffects()
);

const store = createStore(reducer, preloadedState, enhancer);
```

``` javascript
import { combineReducers, createStateWithEffects } from "effex";
import { USER_LOGGED_IN, USER_TOKEN_STORED, userTokenStored } from "./actions";

// side effects perform async actions and may return an action to be dispatched
async function storeUserToken(token) {
  await SecureStorage.setItem("USER_TOKEN", token);

  return userTokenStored(token);
}

// side effects can use other side effects
async function clearUserToken() {
  return storeUserToken(null);
}

// declare your side effects in your reducer
// this gives you access to the action payload and local state
export default function tokenReducer(state = null, action) {
  switch (action.type) {
    case USER_LOGGED_IN:
      return createStateWithEffects(state, () => storeUserToken(action.payload.token));

    case USER_LOGGED_OUT:
      return createStateWithEffects(state, clearUserToken);

    case USER_TOKEN_STORED:
      return action.payload;

    default:
      return state;
  }
}
```
