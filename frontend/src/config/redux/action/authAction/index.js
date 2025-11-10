import { clientServer } from '@/config';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { connection } from 'next/server';

// Login User
export const loginUser = createAsyncThunk(
  'user/login',
  async (user, thunkAPI) => {
    try {

        const response = await clientServer.post(`/login`, {
            email: user.email,
            password: user.password
        });

        if(response.data.token) {
            localStorage.setItem("token", response.data.token);
        } else {
            return thunkAPI.rejectWithValue({ message: "token not provided" });
        }

        return thunkAPI.fulfillWithValue(response.data.token); //payload(message)
        

    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data);
    }
  },
)

// Register User
export const registerUser = createAsyncThunk(
    'user/register',
    async (user, thunkAPI) => {
        try {
            const request = await clientServer.post("/register", {
                username: user.username,
                password: user.password,
                email: user.email,
                name: user.name,
            });

            return thunkAPI.fulfillWithValue(request.data.message); //payload(message)

        } catch(error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
)

// Get About User
export const getAboutUser = createAsyncThunk(
    "user/getAboutUser",
    async (user, thunkAPI) => {
        try {
            const response = await clientServer.get("/get_user_and_profile", {
                params: {
                    token : user.token
                }
            });

            return thunkAPI.fulfillWithValue({
                profile: response.data
            }); //payload(profile)

        } catch(error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
)


// Get All Users

export const getAllUsers = createAsyncThunk(
    "user/getAllUsers",
    async (_, thunkAPI) => {
        try {

            const response = await clientServer.get('/user/get_all_users')

            return thunkAPI.fulfillWithValue(response.data);
            
        } catch(error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }

    }
)


// Send Connection Request
export const sendConnectionRequest = createAsyncThunk(
  "user/sendConnectionRequest",
  async (user, thunkAPI) => {
    try {
      const response = await clientServer.post("/user/send_connection_request", {
        token: user.token,
        connectionId: user.user_id,
      });

      thunkAPI.dispatch(getConnectionsRequest( {token: user.token} ))

      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);


// Get Connections Request
export const getConnectionsRequest = createAsyncThunk(
  "user/getConnectionsRequest",
  async (user, thunkAPI) => {
    try {

      const response = await clientServer.get("/user/get_connections_requests", {

        params: { 
            token: user.token 
        }

      });
      return thunkAPI.fulfillWithValue(response.data.connections);

    } catch (error) {
      console.log(error)
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);


// Get my connections request
export const getMyConnectionRequets = createAsyncThunk(
    "user/getMyConnectionRequests",
    async (user, thunkAPI) => {

        try {

            const response = await clientServer.get("/user/get_connections_requests", { //get_connections_requests
                params: {
                    token: user.token
                }
            });

            return thunkAPI.fulfillWithValue(response.data.connections);
        } catch(error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
)


// Accept Connection
export const AcceptConnection = createAsyncThunk(
    "user/acceptConnection",
    async (user, thunkAPI) => {

        try {

            const response = await clientServer.post("/user/accept_connection_request", {
                token: user.token,
                requestId: user.connectionId,
                action_type: user.action
            });

            thunkAPI.dispatch(getConnectionsRequest({ token: user.token }))
            thunkAPI.dispatch(getMyConnectionRequets({ token: user.token }))
            return thunkAPI.fulfillWithValue(response.data);
        } catch(error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
)