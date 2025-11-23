import { createSlice } from "@reduxjs/toolkit";

const savedUser = JSON.parse(localStorage.getItem("userData")) || {};
const savedToken = localStorage.getItem("accessToken");

const initialState = {
  _id:savedUser._id ||"",
  username: savedUser.username || "",
  email: savedUser.email || "",
  avatar: savedUser.avatar || null,
  token: savedToken || null,
  isAuthenticated: !!savedToken,
  token_code: localStorage.getItem(`token_code_${savedUser?.email}`) || null,
};


const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginUser: (state, action) => {
      const { username, email, avatar, token,_id } = action.payload;
      state._id=_id,
      state.username = username;
      state.email = email;
      state.avatar = avatar;
      state.token = savedToken||token;
      state.isAuthenticated = true;

      localStorage.setItem(
        "userData",
        JSON.stringify({_id, username, email, avatar, token })
      );

      localStorage.setItem("accessToken", token);
      localStorage.setItem("isAuthenticated", "true");
    },

    logoutUser: (state) => {
      const email = state.email;

      // Clear Redux state
      state._id=""
      state.username = "";
      state.email = "";
      state.avatar = null;
      state.token = null;
      state.token_code = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("folders");
      localStorage.removeItem("isAuthenticated");
      // localStorage.clear()
      if (email) {
        localStorage.removeItem(`token_code_${email}`);
      }
    },

    tokenValues: (state, action) => {
    const { token_code, email } = action.payload;
      state.token_code = token_code;

      if (email && token_code) {
        localStorage.setItem(`token_code_${email}`, token_code);
      }
    }

  },
});

export const { loginUser, logoutUser, tokenValues } = userSlice.actions;
export default userSlice.reducer;
