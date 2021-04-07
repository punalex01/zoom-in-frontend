import React, {useState, useEffect} from "react";
import Meetings, {meetingcache} from './components/Meeting';
import Login from './Login'
import './index.css';
import './components/Header.css'
import CalendarPage from './CalendarPage';
import {BrowserRouter as Router, Switch, Route, useHistory} from "react-router-dom"
import Axios from 'axios';
import { setup } from 'axios-cache-adapter'

//cache
const usrnmcache = setup({
  cache: {
    maxAge: 180 * 60 * 1000,
    invalidate: async (config,request) => {
      if (request.clearCache) {
        await config.store.removeItem(config.uuid)
      }
    }
  }
})

function clearCache() {
  usrnmcache.get('http://localhost:5000/user', { clearCache: true }).then(response => {
    console.log(response.request.fromCache !== true)
  })
  meetingcache.get('http://localhost:5000/meetings', { clearCache: true }).then(response => {
      console.log(response.request.fromCache !== true)
    })
}

export default function App() {
  const [isLoggedIn, setLogIn] = React.useState(!!document.cookie);

  function verifyCookies() {
    if (document.cookie) {
      let allCookies = document.cookie.split("; ")
      let user = allCookies[0].split('=')[1]
      let value = allCookies[1].split('=')[1]
      return Axios({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        url: 'http://localhost:5000/verifyToken',
        data: {
          'user': user,
          'value': value
        }
      })
      .then(res => res.data)
      .catch(() => false)
    }
    else {
      return new Promise((resolve) => {
        resolve(false)
      })
    }
  }

  useEffect(() => {
    // verify token/login
    // should check
    verifyCookies().then(res => {
      setTimeout(() => {
        if (res) {
          setLogIn(true)
        }
        else {
          setLogIn(false)
        }
      }, 1000)
    })
  }, [])

  if (!isLoggedIn) {
    // redirect to log in page if not logged in
    return (<Login isLoggedIn={isLoggedIn} setLogIn={setLogIn}/>);
  }
  else {
    return (
      <div className="App">
        <Router>
          <Header setLogIn={setLogIn} verifyCookies={verifyCookies}/>
          <Switch>
            <Route exact={true} path="/">
              <Home />
              </Route>
            <Route path="/calendar">
              <CalendarPage />
            </Route>
          </Switch>
        </Router>
      </div>
    )
  }
}
 
function Header({setLogIn, verifyCookies}) {
  // checks if logged in when header buttons is pressed
  const history = useHistory();
  const routeTo = (path) => {
    verifyCookies().then(res => {
      if (res)
        history.push(path)
      else
        setLogIn(false)
    })
  }

  const logOut = () => {
    let allCookies = document.cookie.split("; ")
    // deletes all cookies
    allCookies.forEach((cookie) => {
      document.cookie = cookie + "; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    })
    //clear caches
    clearCache()
    setLogIn(false)
  }

  return (
    <div className="header-container">
      <button className="zoom-in-title">ZOOM IN</button>
      <button className="header-text" onClick={() => routeTo("/")}>
        Home
      </button>
      <button className="header-text" onClick={() => routeTo("/calendar")}>
        Calendar
      </button>
      <button className="header-text" onClick={() => logOut()}>
        Log Out
      </button>
    </div>
  );
}

function Home() {
  const [user,setUser] = useState("");
  let allCookies = document.cookie.split("; ")
  let value;
  if (allCookies.length < 2)
    value = 0;
  else
    value = allCookies[1].split('=')[1];
  usrnmcache({
    method: "get",
    url: 'http://localhost:5000/user',
    headers: {
      'Authorization': `Bearer ${value}`,
    }
  })
  .then(async (user) =>{
    setUser(user.data);
  });
  return(
    <div className="body-contents">
        <span id="welcome-back" className="welcome-back">Welcome back, {user}!</span>
        <br></br><br></br>
        {<Meetings />}
    </div>
  );
}

