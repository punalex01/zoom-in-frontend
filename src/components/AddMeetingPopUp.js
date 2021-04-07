import React from 'react';
import Axios from 'axios';
import "./AddMeetingPopUp.css";


class AddMeetingPopUp extends React.Component {
    constructor() {
        super();
        this.state = {
            //for rendering of certain components
            repeat: false, //determines type of meeting (repeat/single)
            text: [["a date","repeats"],["days of the week","does not repeat"]], 

            //meeting data
            name:'',
            desc:'',
            sTime:'',
            eTime:'',
            tagName:'',
            tagColor:"#ffffff",
            zoomPassword:'',
            zoomLink:'',
            zoomID:'',
            //data for repeating meetings
            mon:false,
            tue:false,
            wed:false,
            thr:false,
            fri:false,
            sat:false,
            sun:false,
            sWeek:'',
            eWeek:'',
            //data for nonrepeating meetings
            date:''        
        }
        this.RenderSingle = this.RenderSingle.bind(this);
        this.RenderRepeat = this.RenderRepeat.bind(this);
    }

    toggleRepeat = () => {
        this.setState({repeat: !this.state.repeat});
    };

    postDataHandler = (e) =>{
        e.preventDefault();

        let allCookies = document.cookie.split("; ") //authorization token
        let value
        if (allCookies.length < 2)
        value = 0
        else
        value = allCookies[1].split('=')[1]

        /////////////////date manipulation functions/////////////////

        //returns the monday of a given week & year as a date object
        function firstDayOfWeek (year, week) {
            let d = new Date(year, 0, 1),
                offset = d.getTimezoneOffset();
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000 
                * (week + (year === d.getFullYear() ? -1 : 0 )));
            d.setTime(d.getTime() 
                + (d.getTimezoneOffset() - offset) * 60 * 1000);
            d.setDate(d.getDate() - 3);
            return d;
        }
        //add x amt of days
        Date.prototype.addDays = function(days) {
            let date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }
        //get date object for first meeting day
        function getFirstMeetDay(firstMondayofYear, startWeek, daysOfWeek)
        {
            let dayOffset = 0;
            if (daysOfWeek.mon)
                dayOffset = 0;
            else if (daysOfWeek.tue)
                dayOffset = 1;
            else if (daysOfWeek.wed)
                dayOffset = 2;
            else if (daysOfWeek.thr)
                dayOffset = 3;
            else if (daysOfWeek.fri)
                dayOffset = 4;
            else if (daysOfWeek.sat)
                dayOffset = 5;
            else if (daysOfWeek.sun)
                dayOffset = 6;
            return firstMondayofYear.addDays(dayOffset+(7*startWeek));
        }
        //get date object for last meeting day
        function getLastMeetDay(firstMondayofYear, startWeek, daysOfWeek)
        {
            let dayOffset = 0;      
            if (daysOfWeek.sun)
                dayOffset = 6;
            else if (daysOfWeek.sat)
                dayOffset = 5;
            else if (daysOfWeek.fri)
                dayOffset = 4;
            else if (daysOfWeek.thr)
                dayOffset = 3;
            else if (daysOfWeek.wed)
                dayOffset = 2;
            else if (daysOfWeek.tue)
                dayOffset = 1;
            else if (daysOfWeek.mon)
                dayOffset = 0;
            return firstMondayofYear.addDays(dayOffset+(7*startWeek));
        }
        //set time for a given day
        function setDateTime(date, time) {
            let index = time.indexOf(":");                
            let hours = time.substring(0, index);
            let minutes = time.substring(index + 1, time.length);               
            let newDate = new Date(date.getTime());

            newDate.setHours(hours);
            newDate.setMinutes(minutes);        
            return newDate;
        }
        //////////////end of date manipulation functions////////////////


        //code for adding meetings
        if (!this.state.repeat) //for nonrepeating meetings, jsut call one post request
        {
            let meeting = {}; //construct meetings object

            let b = this.state.date.split(/\D/);
            let meetDate = new Date(b[0], --b[1], b[2]);
            const sTime = setDateTime(meetDate, this.state.sTime);
            const eTime = setDateTime(meetDate, this.state.eTime);

            meeting['sTime'] = sTime.getTime();
            meeting['eTime'] = eTime.getTime();
            meeting["name"] = this.state.name;
            meeting["description"] = this.state.desc;
            meeting["tagName"] = this.state.tagName;
            meeting["tagColor"] = this.state.tagColor;
            meeting["zoomLink"] = this.state.zoomLink;
            meeting["zoomID"] = this.state.zoomID;
            meeting["zoomPassword"] = this.state.zoomPassword;
            meeting["id"] = 0;

            if (sTime > eTime) //check validity of user's input
                alert("Error: Please pick a start time that occurs before the end time.")
            else             //post single meeting
            {
                Axios({
                    method: 'POST',
                    headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${value}`
                },
                    url: 'http://localhost:5000/meetings',
                    data: meeting
                })
                .then(res => {
                    if (res.data.success)
                    {
                        window.location.reload();
                    }
                })
                .catch(error => {
                    if (error.response.status === 403) {
                    alert("Something went wrong while adding a meeting!");
                    }
                });
            }
        }

        else //for repeating meetings, calculate each meeting date and call multiple post requests
        {
            //check validity of user's input data
            let timeError = false;  //if start time is after end time
            let weekError = false;  //if start week is after end week
            let daysOfWeekError = false;    //user selected no days of the week

            let daysOfWeek = {  //more convenient storage of days
                "mon": this.state.mon,
                "tue": this.state.tue,
                "wed": this.state.wed,
                "thr": this.state.thr,
                "fri": this.state.fri,
                "sat": this.state.sat,
                "sun": this.state.sun,
            };
            if ( !daysOfWeek.mon && !daysOfWeek.tue && !daysOfWeek.wed && !daysOfWeek.thr && !daysOfWeek.fri && !daysOfWeek.sat && !daysOfWeek.sun)
            {
                daysOfWeekError = true;
                alert("Error: Please pick at least one day of the week for the meeting to occur on.")
                return;
            }

             //parse startweek and endweek inputs into ints ("2021-W05" --> 2021 and 5)
            let startInput = this.state.sWeek;
            let endInput = this.state.eWeek;
            let startYear, endYear, startWeek, endWeek;
            startYear = endYear = startWeek = endWeek = "";
            for(let i = 0; i < startInput.length; i++)
            {
                if (i < 4) 
                {
                    startYear = startYear.concat(startInput.charAt(i));
                    endYear = endYear.concat(endInput.charAt(i));
                }
                else if (i === 5) {} //skip over "-W"
                else if (i > 5)
                {
                    startWeek = startWeek.concat(startInput.charAt(i));
                    endWeek = endWeek.concat(endInput.charAt(i));
                }
            }

            startWeek--; //-1 for correct calculations
            endWeek--;

            //get the first monday of a year (monday of week 1 of a year)
            let firstMondayOfStartYear = firstDayOfWeek(startYear, 1);
            let firstMondayOfEndYear = firstDayOfWeek(endYear, 1);

            //determine first/last meet date by adding startWeek to the monday of week 1, + corresponding day
            let firstMeetDate = getFirstMeetDay(firstMondayOfStartYear, startWeek, daysOfWeek);
            let lastMeetDate = getLastMeetDay(firstMondayOfEndYear, endWeek, daysOfWeek)

            //check for user error
            if (setDateTime(firstMeetDate, this.state.sTime) > setDateTime(firstMeetDate, this.state.eTime))
            {
                timeError = true;
                alert("Error: Please pick a start time that occurs before the end time.")
                return;
            }
            if (firstMeetDate > lastMeetDate)
            {
                weekError = true;
                alert("Error: Please pick a start week that occurs before the end week.")
                return;
            }

            //stores all meeting dates for a particular recurring meeting, each will have a post request
            let allMeetDates = [];

            //add first meeting to array
            allMeetDates.push(firstMeetDate);

            let year = firstMeetDate.getFullYear(),
                month = firstMeetDate.getMonth(),
                day = firstMeetDate.getDate();
            //loop through the date range of first to last meeting dates,
            //add to array if meeting occurs on that day
            while(allMeetDates[allMeetDates.length-1] < lastMeetDate) {
                let d = new Date(year, month, ++day)
                if (d.getDay() === 0 && this.state.sun) //if sunday & meeting occurs on sunday
                    allMeetDates.push(d);
                if (d.getDay() === 1 && this.state.mon) //if monday & meeting occurs on monday
                    allMeetDates.push(d);
                if (d.getDay() === 2 && this.state.tue) //...
                    allMeetDates.push(d);
                if (d.getDay() === 3 && this.state.wed) //...
                    allMeetDates.push(d);
                if (d.getDay() === 4 && this.state.thr)
                    allMeetDates.push(d);
                if (d.getDay() === 5 && this.state.fri)
                    allMeetDates.push(d);
                if (d.getDay() === 6 && this.state.sat)
                    allMeetDates.push(d);
            }

            //post request for each date in dates array
            if (!timeError && !weekError && !daysOfWeekError)
            {
                let axiosArray = []; //array of axios requests
                for (let x = 0; x < allMeetDates.length; x++) { //for each date in array
                    let meeting = {};
                    const s = setDateTime(allMeetDates[x], this.state.sTime); //combine the calculated date object
                    const e = setDateTime(allMeetDates[x], this.state.eTime); //with the user's time inputs
                    meeting['sTime'] = s.getTime();
                    meeting['eTime'] = e.getTime();
                    meeting["name"] = this.state.name;
                    meeting["description"] = this.state.desc;
                    meeting["tagName"] = this.state.tagName;
                    meeting["tagColor"] = this.state.tagColor;
                    meeting["zoomLink"] = this.state.zoomLink;
                    meeting["zoomID"] = this.state.zoomID;
                    meeting["zoomPassword"] = this.state.zoomPassword;

                    let newPromise = Axios({
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${value}`
                        },
                        url: 'http://localhost:5000/meetings',
                        data: meeting
                    })
                    axiosArray.push(newPromise)
                    }
                Axios
                    .all(axiosArray)
                    .then(Axios.spread((...responses) => {
                    responses.forEach(res => console.log('Success'))
                    window.location.reload();
                    }))
                    .catch(error => {
                        if (error.response.status === 403) {
                            alert("Something went wrong while adding recurring meetings");
                        }
                    })
            }
        }
    }

    RenderSingle() {    //interface for adding a single meeting (date input)
        return (
          <div>
            <br></br>
            <label className="day-of-week" htmlFor="date">Date  </label>
            <input type="date" name="date" id="date" required
                value= {this.state.date} onChange={(e)=>this.setState({date:e.target.value})}/>
          </div>
        );
      }

    RenderRepeat() {    //interface for adding a repeating meeting (start/end week, days of week)
        const changecolor = (day) => {};
        return (
          <div>
            <ul required>
              <label className="day-of-week" htmlFor="mon" onClick={changecolor("day-of-week")}>MON </label>
              <input type="checkbox" name="mon" id="mon"
                    value= {this.state.mon} onClick={(e)=>this.setState({mon:e.target.checked})}/>
              <label className="day-of-week" htmlFor="tue">TUE </label>
              <input type="checkbox" name="tue" id="tue"
                    value= {this.state.tue} onClick={(e)=>this.setState({tue:e.target.checked})}/>
              <label className="day-of-week" htmlFor="wed">WED </label>
              <input type="checkbox" name="wed" id="wed"
                    value= {this.state.wed} onClick={(e)=>this.setState({wed:e.target.checked})}/>
              <label className="day-of-week" htmlFor="thr">THR </label>
              <input type="checkbox" name="thr" id="thr"
                    value= {this.state.thr} onClick={(e)=>this.setState({thr:e.target.checked})}/>
              <label className="day-of-week" htmlFor="fri">FRI </label>
              <input type="checkbox" name="fri" id="fri"
                    value= {this.state.fri} onClick={(e)=>this.setState({fri:e.target.checked})}/>
              <label className="day-of-week" htmlFor="sat">SAT </label>
              <input type="checkbox" name="sat" id="sat"
                    value= {this.state.sat} onClick={(e)=>this.setState({sat:e.target.checked})}/>
              <label className="day-of-week" htmlFor="sun">SUN </label>
              <input type="checkbox" name="sun" id="sun"
                    value= {this.state.sun} onClick={(e)=>this.setState({sun:e.target.checked})}/>
            </ul>

            <label htmlFor="start">Start </label>
            <input type="week" name="start" id="start" required
                    value= {this.state.sWeek} onChange={(e)=>this.setState({sWeek:e.target.value})}/>
            <label htmlFor="end"> End </label>
            <input type="week" name="end" id="end" required
                    value= {this.state.eWeek} onChange={(e)=>this.setState({eWeek:e.target.value})}/>
          </div>
        );
      }

    render(){
        return(
            <div className="pop-up">
            <div className="pop-up_content">
              <span className="close" onClick={this.props.toggle}>
                &times;
              </span>
              
              <form onSubmit={this.postDataHandler}>
                <div>
                  <div>
                    <label htmlFor="name">Meeting </label>
                    <input type="text" name="name" id="name" placeholder="Name" required
                        value= {this.state.name} onChange={(e)=>this.setState({name:e.target.value})}/>
                    <br></br><br></br>
                    <label htmlFor="desc">Description </label>
                    <input type="text" name="desc" id="desc"
                        value= {this.state.desc} onChange={(e)=>this.setState({desc:e.target.value})}/>
                  </div>

                  <div>
                    <br></br> {/* displays message and input fields for repeat vs single meetings*/}
                    Date: Choose {this.state.repeat ? this.state.text[1][0] : this.state.text[0][0]} or click {this.state.repeat ? this.state.text[1][1] : this.state.text[0][1]} &ensp;
                    <br></br>
                    {this.state.repeat ? <this.RenderRepeat />: <this.RenderSingle />}
                    <br></br>
                    <input type="button" onClick={this.toggleRepeat} value={this.state.repeat ? this.state.text[1][1] : this.state.text[0][1]} />
                  </div>

                  <div>
                    <br></br>
                    <label htmlFor="sTime">Start </label>
                    <input type="time" name="sTime" id="sTime" required
                        value= {this.state.sTime} onChange={(e)=>this.setState({sTime:e.target.value})}/>

                    <label htmlFor="eTime">  End </label>
                    <input type="time" name="eTime" id="eTime"
                        value= {this.state.eTime} onChange={(e)=>this.setState({eTime:e.target.value})}/>
                  </div>

                  <div>
                    <br></br>
                    <label htmlFor="link">Link </label>
                    <input type="link" name="link" id="link" placeholder="URL"
                        value= {this.state.zoomLink} onChange={(e)=>this.setState({zoomLink:e.target.value})}/>
                    <br></br><br></br>
                    <label htmlFor="ID">ID </label>
                    <input type="text" name="ID" id="ID" placeholder="ID"
                        value= {this.state.zoomID} onChange={(e)=>this.setState({zoomID:e.target.value})}/>

                    <br></br><br></br>
                    <label htmlFor="password">Password </label>
                    <input type="password" name="pass" id="pass" placeholder="Password"
                        value= {this.state.zoomPassword} onChange={(e)=>this.setState({zoomPassword:e.target.value})}/>
                  </div>

                  <div>
                    <br></br>
                    <label htmlFor="tagName">Tag </label>
                    <input type="text" name="tagName" id="tagName" placeholder="Tag Name"
                        value= {this.state.tagName} onChange={(e)=>this.setState({tagName:e.target.value})}/>
                    <label htmlFor="tagColor">  Tag Color </label>
                    <input type="color" name="tagColor" id="tagColor" placeholder="#dcdcdc"
                        value= {this.state.tagColor} onChange={(e)=>this.setState({tagColor:e.target.value})}/>
                  </div>
                </div>
                <br/><br></br>
                <input type="submit" />
              </form>
            </div>
          </div>
        )
    }
}

export default AddMeetingPopUp;