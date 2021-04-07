import React, { useState } from "react";
import './Login.css'
import Axios from 'axios';

export default function Login({isLoggedIn, setLogIn}) {

  const [isSignUp, setSignUp] = useState(false)
  const [errorMessage, setError] = useState("")

  let indicateLogin;
  if (isSignUp)
    indicateLogin = "Sign Up"
  else
    indicateLogin = "Log In"

  function submitLogin(event) {
    event.preventDefault()
    let inputUser = document.getElementById('username').value
    let inputPass = document.getElementById('password').value

    // check for invalid characters
    const invalidChars = new RegExp('[^a-zA-Z1-9]')
    if (invalidChars.test(inputUser)) {
      setError("Invalid Characters in Username")
      return
    }

    let credentials = {
      'username': inputUser, 
      'password': inputPass
    }
    credentials = JSON.stringify(credentials)

    // post request for login
    if (!isSignUp) {
      Axios({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        url: 'http://localhost:5000/login',
        data: credentials
      })
      .then((res) => {
        if (res.data !== "Invalid Password") {
          setError("")
          let token = {
            user: res.data.user,
            value: res.data.accessToken,
            expires: res.data.expires
          }
          document.cookie = `user=${token.user}; expires=${token.expires}`
          document.cookie = `value=${token.value}; expires=${token.expires}`
          setLogIn(true)
        }
      })
      .catch(() => {
          setError("Invalid Username or Password")
      })
    }
    // post request for sign up
    // then adds gets token and adds it to cookies
    else {
      Axios({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        url: 'http://localhost:5000/newUser',
        data: credentials
      })
      .then((res) => {
        if (res.data) {
          let token = {
            user: res.data.user,
            value: res.data.accessToken,
            expires: res.data.expires
          }
          document.cookie = `user=${token.user}; expires=${token.expires}`
          document.cookie = `value=${token.value}; expires=${token.expires}`
          setLogIn(true)
        } 
        else
          setError("Invalid Username")
      })
      .catch((error) => {
        if (error.response.status === 403 || error.response.status === 401)
          setError("Invalid Username")
        else
          setError("Something went wrong")
      })
    }
  }

  return (
    <div className="login-background">
      <div className="login-container">
        <div className="login-button-container">
          <button className="login-button" onClick={()=>setSignUp(false)}>Login</button>
          <button className="login-button" onClick={()=>setSignUp(true)}>Sign Up</button>
        </div>
        <form className="login-form" onSubmit={submitLogin}>
            <img src="/favicon.png" alt="" className="login-logo"></img>
            <h2 className="login-title">ZOOM IN</h2>
            <input type="text" placeholder="username" id="username"  className="login-input" required></input>
            <input type="password" placeholder="password" id ="password" className="login-input" required></input>
            <button type="submit" className="submit-login">{indicateLogin}</button>
            <span>{errorMessage}</span>
        </form>
      </div>
    </div>
    

  );
}