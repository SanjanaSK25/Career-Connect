const { default: axios } = require("axios");

export const BASE_URL = "https://career-connect-3tp7.onrender.com/";

export const clientServer = axios.create({
    baseURL: BASE_URL,
})