import { combineReducers, createStore } from "redux";
import {datVeReducer} from "./reducers/datVeReducer"



const rootReducer = combineReducers({
    datVeReducer,
});

export const store = createStore(rootReducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());