import React, { useEffect, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import Axios from 'axios';
import Meetings from './components/Meeting';
import DetailsPopUp from './components/DetailsPopUp'
import '../node_modules/react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarPage.css'

function CalendarPage() {
  const [calendarMeetings, setMeetings] = useState([])
  const [tagColors, setTagColors] = useState({})
  const [popUp,setPopUp] = useState(null)

  // used to open/close pop up window
  const togglePopUp = (eventID) => {
    if (typeof eventID === "string") {
      setPopUp(<DetailsPopUp id={eventID} toggle={togglePopUp} />)
    }
    else {
      setPopUp(null)
    }
  };

  // get meetings and convert to calendar format
  useEffect(() => {
    let allCookies = document.cookie.split("; ")
    let value
    if (allCookies.length < 2)
      value = 0
    else
      value = allCookies[1].split('=')[1]

    Axios({
      method: "get",
      url: 'http://localhost:5000/meetings',
      headers: { 
        'Authorization': `Bearer ${value}`
      },
    })
    .then ((result) => {
        const tempMeetings = []
        const userMeetings = result.data
        let tempDict = {}
        for (let meeting of userMeetings) {

          // convert to format for calendar
          let convertedMeeting = {
            title: meeting.name,
            start: new Date(meeting.sTime),
            end: new Date(meeting.eTime),
            id: meeting.id,
            tagColor: meeting.tagColor,
          }
          tempMeetings.push(convertedMeeting)

          // set tag colors for legend
          if (meeting.tagName !== "")
            tempDict[meeting.tagColor] = meeting.tagName
        }
        setMeetings(tempMeetings)
        setTagColors(tempDict)
    })
    .catch((error) => {
      setMeetings("N/A");
    });
  }, [])

  // set each event to their tagged color
  const changeEventColor = (event) => {
    const newStyle = {
      backgroundColor: event.tagColor,
    }
    return { style: newStyle}
  }



  const localizer = momentLocalizer(moment)
  
  return (
    <div className="calendar-page">
        <MeetingsList/>
      <div className="calendar-container">
        <Calendar 
          localizer={localizer} 
          events={calendarMeetings} 
          startAccessor="start" 
          endAccessor="end" 
          defaultDate={moment().toDate()} 
          views={['day', 'week', 'month']}
          eventPropGetter={(event => changeEventColor(event))}
          onSelectEvent={(event) => togglePopUp(event.id)}
        />
        <div className="legend-container">
          <h3>Tags</h3>
          <TagList tagColors={tagColors}/>
        </div>
      </div>
      {popUp ? popUp : null}
    </div>
  )
}

function MeetingsList() {
  return (
    <div className="calendar-page-all-container" id="calendar-meetings-list">
      <Meetings />
    </div>
  );
}

function TagList({tagColors}) {
  return (
    // renders every color with a tagname in legend
    Object.keys(tagColors).map((color) => {
      return (
        <div className="legend-tags">
          <div className="tag-color" style={{backgroundColor: color}}></div>
          <span>{tagColors[color]}</span>
        </div>
      )
    })

  )
}

export default CalendarPage;

