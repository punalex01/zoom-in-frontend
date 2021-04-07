import React from "react";
import "./DetailsPopUp.css";
import Axios from 'axios';

class DetailsPopUp extends React.Component{
    constructor(props){
     super();
     this.state = {
         //for rendering of certain components
         editMode: false,
         showPassword: false,

         //meeting data
         id: props.id,
         name: "",
         desc: "",
         sTime: "",
         eTime: "",
         tagName: "",
         tagColor: "",
         zoomID: "",
         zoomLink: "",
         zoomPassword: "",

         //store edited info
         e_name: "",
         e_desc: "",
         e_sTime: "",
         e_eTime: "",
         e_tagName: "",
         e_tagColor: "",
         e_zoomID: "",
         e_zoomLink: "",
         e_zoomPassword: "",
        }

    this.RenderDetails = this.RenderDetails.bind(this);
    this.RenderEdit = this.RenderEdit.bind(this);
    this.RenderPassword = this.RenderPassword.bind(this);
    this.deleteData = this.deleteData.bind(this);
    }

    togglePasswordState = () => {
        this.setState({showPassword: !this.state.showPassword});
    };

    toggleEditState = () => {
        this.setState({editMode: !this.state.editMode});
    };

    componentDidMount(){
        this.getData(); //get data once when details window first appears
    }

    async getData(){
        let allCookies = document.cookie.split("; ") //authorization 
        let value
        if (allCookies.length < 2)
        value = 0
        else
        value = allCookies[1].split('=')[1]

        Axios({
        method: "get",
        url: 'http://localhost:5000/meetings/' + this.state.id,
        headers: { 
            'Authorization': `Bearer ${value}`
        },
        })
        .then ((result) => {
            this.setState(
                {
                    name: result.data[0].name,
                    desc: result.data[0].description,
                    sTime: result.data[0].sTime,
                    eTime: result.data[0].eTime,
                    tagName: result.data[0].tagName,
                    tagColor: result.data[0].tagColor,
                    zoomID: result.data[0].zoomID,
                    zoomLink: result.data[0].zoomLink,
                    zoomPassword: result.data[0].zoomPassword,

                    e_name: result.data[0].name,
                    e_desc: result.data[0].description,
                    e_sTime: result.data[0].sTime,
                    e_eTime: result.data[0].eTime,
                    e_tagName: result.data[0].tagName,
                    e_tagColor: result.data[0].tagColor,
                    e_zoomID: result.data[0].zoomID,
                    e_zoomLink: result.data[0].zoomLink,
                    e_zoomPassword: result.data[0].zoomPassword
                })
        })
        .catch((error) => {
            alert("Error while retrieving meeting data");
        });   
    }

    deleteData(){
        let allCookies = document.cookie.split("; ") //authorization
        let value
        if (allCookies.length < 2)
        value = 0
        else
        value = allCookies[1].split('=')[1]

        Axios({
            method: "delete",
            url: 'http://localhost:5000/meetings/' + this.state.id, //append id to route to refer to specific meeting
            headers: { 
                'Authorization': `Bearer ${value}`
            },
            })
            .then ((result) => {
                window.location.reload();
            })
            .catch((error) => {
                alert("Error while deleting meeting");
            });   
    }

    editData = (e) =>{
        e.preventDefault(); //prevent default submit button behavior

        let allCookies = document.cookie.split("; ") //authorization
        let value
        if (allCookies.length < 2)
        value = 0
        else
        value = allCookies[1].split('=')[1]

        let meeting = {}    //construct a meetings object with edited data
        meeting['name'] = this.state.e_name;
        meeting["description"] = this.state.e_desc;
        meeting["tagName"] = this.state.e_tagName;
        meeting["tagColor"] = this.state.e_tagColor;
        meeting["zoomLink"] = this.state.e_zoomLink;
        meeting["zoomID"] = this.state.e_zoomID;
        meeting["zoomPassword"] = this.state.e_zoomPassword;
        meeting["sTime"] = (new Date(this.state.e_sTime)).getTime();
        meeting["eTime"] = (new Date(this.state.e_eTime)).getTime();

        //checking for errors with user's input (if start time is after end time, or no edits made)
        let timeError = false;
        let edited = false;

        if (meeting.name !== this.state.name || meeting.description !== this.state.desc ||
            meeting.tagName !== this.state.tagName || meeting.tagColor !== this.state.tagColor ||
            meeting.zoomLink !== this.state.zoomLink || meeting.zoomID !== this.state.zoomID ||
            meeting.zoomPassword !== this.state.zoomPassword || meeting.sTime !== this.state.sTime ||
            meeting.eTime !== this.state.eTime)
                edited = true;
        else
            alert("Error: You did not specify any changes to this meeting.")

        if (meeting.sTime > meeting.eTime)
            {
                timeError = true;
                alert("Error: Please pick a start time that occurs before the end time.")
            }

        //if no errors, continue on with edit (deletes original and posts a new meeting)
        if (edited && !timeError) //(because firestore doesnt have an easy way to update single elements of an array)
        {           
            Axios({
                method: "delete",
                url: 'http://localhost:5000/meetings/' + this.state.id, //append id to route to refer to specific meeting
                headers: { 
                    'Authorization': `Bearer ${value}`
                },
                })
                .then ((result) => {
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
                        alert("Error adding newly edited meeting");
                        }
                    });
                })
                .catch((error) => {
                    alert("Error while editing meeting (delete phase)");
                }); 
        } 
        else
        {
            //do nothing
        } 
    }
   
    //show meeting password only when state is true (state is toggled when clicked)
    RenderPassword()
    {
        let result = "(click to show)";
        if (this.state.showPassword)
            result = this.state.zoomPassword;

        return (<span className="label-data">{result}</span>)
    }

    RenderDetails() {
        let sTime = new Date(this.state.sTime) //create date objects
        let eTime = new Date(this.state.eTime)

        return (
            <div className="details-container">
                <div className="meeting-name-container">
                   <span className="meeting-name-header">{this.state.name}</span>
                </div>
                <br></br>

                {/* optional input, only display if supplied by user */}
                {this.state.desc ?
                <div className="desc-container">
                    {this.state.desc ? <span><span className="label">Description: </span>
                    <span className="label-data">{this.state.desc}</span>
                    </span>
                    : null}
                </div> 
                : null}

                <br></br><br></br>

                <div className="meeting-time-container">
                    <span className="label">Starts at: </span><span className="label-data">{sTime.toLocaleString()}</span>
                    <br></br><br></br>
                    <span className="label">Ends at: </span><span className="label-data">{eTime.toLocaleString()}</span>
                </div>
                
                <br></br><br></br>

                {/* optional inputs, only display if supplied by user */}
                <div className="meeting-join-info-container">
                    {this.state.zoomLink && <button className="button-join" onClick={() => window.open(this.state.zoomLink,"_blank")}>Join Meeting</button>}
                    <br></br><br></br>

                    {this.state.zoomID ? <span><span className="label">Meeting ID: </span>
                    <span className="label-data">{this.state.zoomID}</span></span>
                    : null}
                    <br></br><br></br>
                    
                    {/* reveal password only when clicked */}
                    <span onClick={this.togglePasswordState} className="password-container">
                        {this.state.zoomPassword ?
                            <span><span className="label">Meeting Password: </span> <span> <this.RenderPassword/> </span></span>
                            : null}
                    </span>
                </div>

                <br></br><br></br>

                {/* optional inputs, only display if supplied by user */}
                <div className="tag-container">
                    {this.state.tagName ? <span><span className="label">Tag: </span>
                    <span className="tag-box" style={ {borderLeftColor: this.state.tagColor}}>{this.state.tagName}</span> </span>
                    : null}
                </div>

                <br></br><br></br>
            </div>
        );
   }

    RenderEdit(props) {
        function convertDate(dateinput) //get ISO string in local time
        {
            let d = new Date(dateinput);
            let tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
            let localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, -1);
            return localISOTime;
        }

        return(
            <div className="pop-up">
                <div className="pop-up_content" style={ {borderLeftColor: this.state.e_tagColor}}>
                    <span className="close" onClick={props.toggle}>
                        &times;
                    </span>

                    <form onSubmit={this.editData}>
                        <div>
                            <label htmlFor="name">Meeting </label>
                            <input type="text" name="name" id="name" placeholder="Name" required
                                value= {this.state.e_name} onChange={(e)=>this.setState({e_name:e.target.value})}/>
                            <br></br><br></br>

                            <label htmlFor="desc">Description </label>
                            <input type="text" name="desc" id="desc"
                                value= {this.state.e_desc} onChange={(e)=>this.setState({e_desc:e.target.value})}/>
                        </div>
                            <br></br>
                            <label htmlFor="sTime">Starts at: </label>
                            <input type="datetime-local" id="sTime" name="sTime" required
                                value= {convertDate(this.state.e_sTime)}
                                onChange={(e)=>this.setState({e_sTime:e.target.value})}/>
                            <br></br>
                            
                            <label htmlFor="eTime">Ends at: </label>
                            <input type="datetime-local" id="eTime" name="eTime" required
                                value= {convertDate(this.state.e_eTime)}
                                onChange={(e)=>this.setState({e_eTime:e.target.value})}/>
                        <div>
                            <br></br>
                            <label htmlFor="link">Link </label>
                            <input type="link" name="link" id="link" placeholder="URL"
                                value= {this.state.e_zoomLink} onChange={(e)=>this.setState({e_zoomLink:e.target.value})}/>
                            <br></br><br></br>

                            <label htmlFor="ID">ID </label>
                            <input type="text" name="ID" id="ID" placeholder="ID"
                                value= {this.state.e_zoomID} onChange={(e)=>this.setState({e_zoomID:e.target.value})}/>
                            <br></br><br></br>

                            <label htmlFor="password">Password </label>
                            <input type="password" name="pass" id="pass" placeholder="Password"
                                value= {this.state.e_zoomPassword} onChange={(e)=>this.setState({e_zoomPassword:e.target.value})}/>
                            <br></br>
                        </div>

                        <div>
                            <br></br>
                            <label htmlFor="tagName">Tag </label>
                            <input type="text" name="tagName" id="tagName" placeholder="Tag Name"
                                value= {this.state.e_tagName} onChange={(e)=>this.setState({e_tagName:e.target.value})}/>
                            <label htmlFor="tagColor">  Tag Color </label>
                            <input type="color" name="tagColor" id="tagColor" placeholder="#dcdcdc"
                                value= {this.state.e_tagColor} onChange={(e)=>this.setState({e_tagColor:e.target.value})}/>
                        </div>

                        <br/><br></br>
                        <input type="submit" value="Confirm Changes"/>
                    </form>
                </div>
            </div>
        )
    }
   
   render(){
    return(
        <div className="pop-up">
            <div className="pop-up_content" style={ {borderLeftColor: this.state.tagColor}}>
            
            <span className="close" onClick={this.props.toggle}>
                &times;
            </span>

            {/* Render meeting details by default, render edit interface when edit button is clicked */}
            {this.state.editMode ? <this.RenderEdit toggle={this.toggleEditState}/> : <this.RenderDetails/>}

            <input type="button" className="button-edit" onClick={this.toggleEditState} value='Edit Meeting' />
            <input type="button" className="button-delete" onClick={this.deleteData} value='Delete Meeting' />

            </div>
        </div>
        )
    }
}

export default DetailsPopUp;