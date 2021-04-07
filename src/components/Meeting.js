import React, {useState, useEffect} from 'react';
import './Meeting.css';
//for searchbar
import SearchField from "react-search-field";
import AddMeetingPopUp from './AddMeetingPopUp';
import DetailsPopUp from './DetailsPopUp';

//cache
import { setup } from 'axios-cache-adapter'

export const meetingcache = setup({
  cache: {
    maxAge: 1 * 60 * 1000,
    invalidate: async (config,request) => {
      if (request.clearCache) {
        await config.store.removeItem(config.uuid)
      }
    }
  }
})

//Gets and divides all meetings according to upcoming/current
function Meetings() {
  const [isSorted,setIsSorted] = useState(false);
  const [items,setItems] = useState(null);
  const [current,setCurrent] = useState([]);
  const [upcoming,setUpcoming] = useState([]);

  //set interval to smallest diff between 
  //"eTime of first in cur-meeting list and curtime" or
  //"sTime of first upcoming-meeting list and curtime"
  function getInterval() {
    let curTime = new Date().getTime()
    let diff1, diff2, cMeet, result
    //find meeting in curtime with smallest eTime
    cMeet = current.sort((a,b) => (a.eTime - b.eTime))
    cMeet.length === 0 ? diff1 = 200 * 60 * 1000 : diff1 = cMeet[0].eTime - curTime
    upcoming.length === 0 ? diff2 = 200 * 60 * 1000 : diff2 = (upcoming[0]).sTime - curTime
    diff1 <= diff2 ? result = diff1 : result = diff2
    return result
  }

  useEffect(() => {
    GetData();
  },[])

  useEffect(() => {
    initialSort();
  },[items])

  useEffect(() => {
    const interval = setInterval(() => {
      Sort();
    },getInterval())
    //cleanup interval
    return () => clearInterval(interval)
  })

  function GetData () {
    let allCookies = document.cookie.split("; ")
    let value
    if (allCookies.length < 2)
      value = 0
    else
      value = allCookies[1].split('=')[1]
    meetingcache({
      method: "get",
      url: 'http://localhost:5000/meetings',
      headers: { 
        'Authorization': `Bearer ${value}`
      },
    })
    .then (async (result) => {
        setItems(result.data);
        setIsSorted(false);
    })
    .catch((error) => {
      setItems("N/A");
      console.log(error);
    });
  };

  function initialSort() {
    if(items) {
      let curTime = new Date().getTime()
      //setCurrent is a list of meetings, where curtime is between sTime eTime range
      setCurrent(items.filter((a) => ( ((a.sTime) <= curTime) && ((a.eTime) >= curTime) ))); 
      //setUpcoming is a list of meetings, where sTime > curTime
      setUpcoming(items.filter((b) => ((b.sTime) > curTime)));
    }
    setIsSorted(true);
  }

  function Sort() {
    if(items) {
      let curTime = new Date().getTime()
      //setCurrent is a list of meetings, where curtime is between sTime eTime range
      setCurrent(items.filter((a) => ( ((a.sTime) <= curTime) && ((a.eTime) >= curTime) ))); 
      //setUpcoming is a list of meetings, where sTime > curTime
      setUpcoming(items.filter((b) => ((b.sTime) > curTime)));
    }
    setIsSorted(true);
  }

  return (
    <div className="meetings-component-container">
      {isSorted && <CurrentMeeting items={current}/>}
      {isSorted && <UpcomingMeetings items={upcoming}/>}
    </div>
  );
}

//Current Meetings Box
function CurrentMeeting(items) {
  function loopCur () {
    items = items.items;
    let list = [];
    let size = items.length;
    if (size === 0)
      return "no current meetings :)"
    else
      for (let x = 0;x<size;x++) {
        let myDate = new Date((items[x]).sTime);
        list[x] = Meeting((items[x]).name,myDate,(items[x]).zoomLink,(items[x]).tagColor,(items[x]).id, true);
      }
    return list;
  }
  return (
    <div className="main-meeting">
      <h3>Current Meetings </h3>
      <div className="meetings-list">
        {loopCur()}
      </div>
    </div>
  );
}

//Upcoming Meetings Box
function UpcomingMeetings(items) {
  const[search,setSearch] = useState(items.items);

  useEffect(() => {
    setSearch(items.items)
  },[items])

  function getSize() {
    return (search.length < 20) ? search.length : 20;
  };

  const onEnter = (Query) => {
    const s = items.items;
    setSearch(s.filter( (a) => ((a.name).includes(Query)) || ((a.tagName).includes(Query))));
  };

  function loopMeetings () {
    let list = [];
    let size = getSize();    
    for (let x = 0; x<size;x++) {
      let myDate = new Date((search[x]).sTime);
      list[x] = Meeting((search[x]).name,myDate,(search[x]).zoomLink,(search[x]).tagColor,(search[x]).id, false);
    }
    return list;
  };

  return (
  <div className="all-container">
    <h3>Upcoming Meetings </h3>

    <div className="flexbox-container">
      <div className="search-bar">
        <SearchField type="text" placeholder="search name or tag" onChange={onEnter} />
      </div>
      <div className="add-button"><AddMeetingButton/></div> 
    </div>

    <div className="meetings-list">
      {loopMeetings()}
    </div>
  </div>
  );
}

//Single meeting
function Meeting( name, myDate, zoomLink, tagColor, id, isCurrent) {
  if (isCurrent)
  {
    //current meetings are bolded
    return (
      <div className="meeting-container" style={ {borderLeftColor: tagColor}}>
        <b><span>{name}</span></b>
        <b><span>{myDate.toLocaleString()}</span></b>
        {zoomLink && <button onClick={() => window.open(zoomLink,"_blank")}>Link</button>}
        <DetailButton id={id}/>
      </div>
    );
  }
  else
  {
    //upcoming meetings
    return (
    <div className="meeting-container" style={ {borderLeftColor: tagColor}}>
      <span>{name}</span>
      <span>{myDate.toLocaleString()}</span>
      {zoomLink && <button onClick={() => window.open(zoomLink,"_blank")}>Link</button>}
      <DetailButton id={id}/>
    </div>
    );
  }
}

//handles click behavior & display of popup window
function AddMeetingButton() {
  const [Seen,setSeen] = useState(false);

  const togglePopUp = () => {
    setSeen(!Seen);
  };
  return (
    <div>
        <button className="button-add-meeting" onClick={togglePopUp}>
          Add Meeting
        </button>

      {Seen ? <AddMeetingPopUp toggle={togglePopUp} /> : null}
    </div>
  );
}

function DetailButton(props) {
  const [detailSeen,setDetailSeen] = useState(false);
  
  const togglePopUp = () => {
    setDetailSeen(!detailSeen);
  };

  return (
    <div>
        <button className="button-show-detail" onClick={togglePopUp}>
          Details
        </button>

      {detailSeen ? <DetailsPopUp id={props.id} toggle={togglePopUp} /> : null}
    </div>
  );
}

export default Meetings;
