import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducer/authReducer';
import postReducer from './reducer/postReducer';

/*
*
* STEPS for State Management using Redux
* Submit Action
* Handle action in it's reducer
* Register Here(in store.js) -> Reducer
*
*/

export const store = configureStore({  
    reducer: {
        auth: authReducer,
        postReducer: postReducer
    }
});