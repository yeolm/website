var allCourses;
var deptCodesShrtN;
var mustCourses;
var dept;
var lastName;
var schedules=[];
//  TAKE NECESSARAY INFO
$(document).ready(function() {
    //AM I KNOWN
    $.getJSON("/known", function(info) {
        if (info.isValid) {
            console.log("username:"+info.username);
            console.log("lastname:"+info.lastname);
            
            lastName=info.lastname;
            dept=info.department;
            schedules=info.schedules;
            if(schedules){
                console.log("firstSchedule:"+schedules[0]);
                currentIndex=0;
            }
            
            if(deptCodesShrtN!=null){
                for(let i=0;i<deptCodesShrtN.length;i++){
                    if(deptCodesShrtN[i]["cc"]==dept||deptCodesShrtN[i]["cn"]==dept){
                        deptName=deptCodesShrtN[i]["cn"];
                    }
                }
            }
        } else {
            console.log("tanınmadım");
        }

    });
    $.get("static/deptCodesShortNames.json", (data) => {
        console.log("deptCodes downloaded");
        deptCodesShrtN = data;
        for(let i=0;i<deptCodesShrtN.length;i++){
            if(deptCodesShrtN[i]["cc"]==dept||deptCodesShrtN[i]["cn"]==dept){
                deptName=deptCodesShrtN[i]["cn"];
            }
        }
        console.log("deptName:"+deptName);



    });
    $.get("static/mustCourses.json", (data) => {
        console.log("mustCourses downloaded");
        mustCourses = data;

    });
    $.getJSON("/courses",function(data){
        console.log("aldım");
       console.log(data[1]["s"][0]["inst"]) ;
       allCourses=data;
       console.log(allCourses[0]["cn"]);
       if (lastName!=null){
           loginStyle(lastName);
       }
    });





});


// SEARCH BOXES
//possibileCourses
var possCourses;
var possDepts;
var possWanted;
var courseIndex=-1;
function search(id,searchbox,jsonArray){
    
    // listen for user input
    $(id).keyup(function(event){
         $(searchbox).show();
        //id:html element id
        var idName=id.substring(1,id.length);
        var wanted=document.getElementById(idName).value.toLowerCase();
         
        // determine keys
        var key;
        let firstChar=wanted.charAt(0);
        let isSpace=false;
        if(firstChar>='a' && 'z'>=firstChar){
            key="cn";
        }
        else if(firstChar==''){
            $(searchbox).hide();
            isSpace=true;
        }
        else{
            key="cc";                
        }
        if(!isSpace){
            // search results 
            possWanted=[4];
            let possIndex =0;
            var size=jsonArray.length;
            console.log("size:"+size);
            for(let i=0;i<size&&possIndex<=3;i++){
                let a=jsonArray[i][key];
                if(a.includes(wanted.toUpperCase())){
                    possWanted[possIndex++]=jsonArray[i][key];
                }

            }
        
            // array assignments
            var distinct=0;
            if(id.charAt(1)=='d'){
                possDepts=possWanted;
                distinct=1;
            }
            else{
                possCourses=possWanted;
            }
        
        
            function prepareContent(poss) {
                let content = "";
                for (let i = 0; i < poss.length; i++) {
                    content += "<ul id=otis><li value="+i+" onclick=setValue("+i+","+distinct+")>" + poss[i] + "</li> </ul>";
                }
                return content;
            }
        
        
            if(possWanted[0]!=4){
                $(searchbox).html(prepareContent(possWanted));
            
            }
            else{
                $(searchbox).hide();
            }
            
        }
 
        document.getElementById("body").addEventListener("click",(e)=>{
            $(searchbox).hide();
            if(distinct==0){
                wanted=document.getElementById(idName).value;
                if(wanted!=''){
                    let isKnown=false;
                    for(let i=0;i<size;i++){
                        if(jsonArray[i][key]==wanted.toUpperCase()){
                            courseIndex=i;
                            // set selects default
                           document.getElementById("day").value="-1";
                            document.getElementById("start_time").value="7";
                            document.getElementById("end_time").value="8";
                            $("#day").attr('disabled',true);
                            $("#start_time").attr('disabled',true);

                            isKnown=true;
                            break;
                        }
                    }
                    if(!isKnown){
                       $("#day").attr('disabled',false);
                        $("#start_time").attr('disabled',false);

                        return;

                    }
                }
     
                
            }
            else return;

        });
        
    });
}

function searchDepartments() {
        
    search("#department","#deptsearch_box",deptCodesShrtN);
    
}

function searchCourse(){

    search("#course","#coursesearch_box",allCourses);


}

function setValue(index,distinct){

    if(distinct==1){
        document.getElementById("department").value=possDepts[index];
        dept=possDepts[index];
    }
    else {
        document.getElementById("course").value=possCourses[index];
    }
    
    
    
}


// return record view
function record() {

    $("#left").html(`<form onsubmit="userRecord();return false;">
                        <div class="form-group">
                            <input autocomplete="off" autofocus class="form-control" id="name" placeholder="Email" type="text"/>
                        </div>
                        <div class="form-group">
                            <input class="form-control" id="surname" placeholder="Surname" type="text"/>
                        </div>
                        
                        
                        
                        <div class="form-group">
                            <input class="form-control" autocomplete=off onclick=searchDepartments() id="department" placeholder="Department" type="text"/>
                            <div class="search" id="deptsearch_box">
                            </div>                            
                        </div>


                        <div class="form-group">
                            <input class="form-control" id="password" placeholder="Password" type="password"/>
                        </div>
                        <div class="form-group">
                            <input class="form-control" id="confirmation" placeholder="Confirmation" type="password"/>
                        </div>
                        <button class="btn id btn-primary" type="submit">Register</button>
                     </form>`);

}

var deptName;
// get user record
function userRecord() {
    //GET DATA FROM USER
    var username = $("#name").val();
    let surname = $("#surname").val().toUpperCase();
    lastName=surname;
    let password = $("#password").val();
    let confirmation = $("#confirmation").val();
    dept=$("#department").val().toUpperCase();
    console.log("dept:"+dept);
    if(dept==null){
        alert("invalid department");
        return;
    }
    //convert deptName to deptCode
    if(dept.charAt(0)>='A'&&dept.charAt(0)<='Z'){
        deptName=dept;
        let size=deptCodesShrtN.length;
        let isValid=false;
        for(let i=0;i<size;i++){
            if(deptCodesShrtN[i]["cn"] == dept){
                isValid=true;
                dept=deptCodesShrtN[i]["cc"];
            }    
        }
        if(!isValid){
            alert("invalid department");
            return;
        }
    }
    else{
        let i=0;
        let size=deptCodesShrtN.length;
        for(;i<size;i++){
            if(deptCodesShrtN[i]["cc"]==dept){
                deptName=deptCodesShrtN[i]["cn"];
                break;
            }
        }
        if(i==size){
            alert("Invalid department");
            return;
        }
    }
    
    
    
    // CHECK USER DATA TO SPECIFY REQUIREMENTS

    if (Object.keys(username).length < 3) {
        alert("username can not be smallar than 3 char");
        return record();
    } else if (Object.keys(surname).length == 0) {
        alert("invalid username");
        return record();
    } else if (Object.keys(password).length == 0) {
        alert("invalid password");
        return record();
    } else if (Object.keys(confirmation).length == 0) {
        alert("invalid confirmation");
        return record();
    }


    if (password != confirmation) {
        console.log("not confirmed");
        alert("not confirmed");
        return record();
    }

    // GET THE user save database ? INFORMATION FROM SERVER

    //send login data and take data

    let info = {
        email: username,
        password: password,
        surname: surname,
        department:dept


    };


    $.getJSON("/record", info, function(output) {
        if (!output.permission) {
            alert("EMAIL ALREADY EXIST");

            return record();
        }
        // RETURN VİEW TO LOGIN STYLE
        else {
            console.log("Logged In");
            loginStyle(surname);
        }

    });

}

// return login view
function login() {
        // take email and password as input and send it to userLogin
        $("#left").html(`<form onsubmit="userLogin();return false;">
                        <div class="form-group">
                            <input autocomplete="off" autofocus class="form-control" id="name" placeholder="Email" type="text"/>
                        </div>
                        <div class="form-group">
                            <input class="form-control" id="password" placeholder="Password" type="password"/>
                        </div>
                        <button class="btn btn-primary" type="submit">Log in</button>
                     </form>`);

}
    

function userLogin() {
    // GET LOGIN INFO
    let username = $("#name").val();

    let infoo = 
    {
        email: username,
        password: $("#password").val()
    };

    // getJson send it to server to check true and take schedules
    $.getJSON("/login", infoo, (info) => {
        if (info.isValid)
        {
            schedules=info.schedules;
            lastName=info.lastName;
            dept=info.department;
            console.log("department:"+dept);

            loginStyle(info.lastName);
            console.log("schedule:"+schedules[0]);

        } else
        {
            return login();

        }

    });
    
}
function loginStyle(username) {
 
 
    $("#right").html((username2) => {
        username2 = username;
        
        var nickName = "<div style=background-color:DarkBlue><div> <h3 class=text>" + username + "</h3></div>" +
            "<div style=float:right><button    type=button onclick=logOut()>Log Out</button></div>" +
            "</div>";
            
        var courseOperations = "<div class=form-group>" +
            "<p class=text2>Add Must Courses</p>" +
            "<div id=semdiv ><input id=semesterNo autocomplete=off onclick=checkSem() autofocus class=mytext placeholder=Semester type=text/><img id=image class=image2>" +
            "</div>" +
            "<p id=semReason></p>" +
            "<div id=semdiv2>" +
            "<button id=mustCourses type=button  onclick=addMustCourses() disabled>Add</button>" +
            "</div>" +

            "<p class=text2>Add Course</p>" +
            '<div id=coursediv><input id=course autocomplete=off autofocus class=mytext onclick=searchCourse() placeholder="Course name/code" type=text/>' +
             "<div class=search id=coursesearch_box> </div>" +
                            

            "<select id=day disabled>" +
            "<option value=-1>Day</option>" +
            "<option value=0>Monday</option>" +
            "<option value=1>Tuesday</option>" +
            "<option value=2>Wednesday</option>" +
            "<option value=3>Thursday</option>" +
            "<option value=4>Friday</option>" +
            "<option value=5>Saturday</option>" +
            "<option value=6>Sunday</option>"+
            "</select>" +

            "<select id=start_time  onclick=adjustEndTime() disabled>" +
            "<option value=7 >Start</option>" +
            "<option value=8 >8:40</option>" +
            "<option value=9 >9:40</option>" +
            "<option value=10 >10:40</option>" +
            "<option value=11 >11:40</option>" +
            "<option value=12 >12:40</option>" +
            "<option value=13 >13:40</option>" +
            "<option value=14 >14:40</option>" +
            "<option value=15 >15:40</option>" +
            "<option value=16 >16:40</option>" +
            "</select>" +

            "<select id=end_time  disabled>" +
            "<option value=8>End</option>" +
            "<option value=9>9:30</option>" +
            "</select>" +

            "</div>" +

            "<button id=manuelCourse type=button  onclick=addManuelCourses() >Add</button>" +
            "<div id=courseInfo> </div>"+
            "</div>";
        return nickName + courseOperations;
    });
    
    isLoggedIn=true;
    displayCurrentSchedule();
  
}
let isLoggedIn=false;
function userStyle(scheduleIndex){
    
    let content="";
    let anotherContent="";
    
    
    // write user shedules info
    if(schedules!=null&&schedules.length != 0){
        
        for(let i=0;i<schedules.length;i++){
            
               content+="<h3 class=serif value="+i+" onclick=displaySchedule("+i+")>"+schedules[i].substring(0,schedules[i].indexOf(":")) + "</h3>";
        }

        console.log("currentSchedule"+currentSchedule);

        // adjustment for login
        if(scheduleIndex==0){
            currentSchedule=schedules[0];
        }
        
        //write current courses

        if(currentSchedule.charAt(currentSchedule.length-1)!=":"){
            
            currentCoursesCodes=currentSchedule.split(":")[1].split(",");

            for(let i=0;i<currentCoursesCodes.length;i++){
                if(currentSchedule.split(":")[1]!=""){
                    if(currentCoursesCodes[i].charAt(0)=="?"){
                        let unknown=currentCoursesCodes[i].substring(1,currentCoursesCodes[i].indexOf("t"));
                        anotherContent+="<div class=courses align=center><h4 class=serif onclick=showCourseInfo("+ i+")>"+unknown+"</h4></div>";
                        continue;
                    }
                    anotherContent+="<div class=courses align=center><h4 class=serif onclick=showCourseInfo("+i+")>"+currentCoursesCodes[i].substring(0,7) +"</h4></div>";
                }
                
            }
            
        }

        
    }
        
    
        
    
        $("#left").html('<div class="w3-container" align="center" style="background-color:DarkBlue;"><h3 class="text">MySchedules</h3></div>' +



        "<div class=storage align=center style=margin:auto>" +
            "<h3 class=serif value=-1>Date-Time</h3>"+
            content+
        "</div>"+
        
        "<div align=center ><button type=button onclick=newSchedule()>New Schedule</button>" +
        
        "<button type=button onclick=saveSchedules()>Save</button>" +
        "</div>"+
        "<div class=w3-container align=center style=background-color:DarkBlue;><h3 class=text>Courses</h3></div>"+
        
        
        anotherContent
    );     
}


function adjustEndTime(){
    

    let start=parseInt(document.getElementById("start_time").value)+1;

    $("#end_time").attr("disabled",false);
    let content="<option value=8>End</option>";
    while(start<=17){
        content+="<option value="+start+">"+start+":30</option>";
        start++;
    }
    $("#end_time").html(content);
    
    
}
function showCourseInfo(courseIndex){



    let ccsTemp=currentSchedule.split(":")[1];
    
    let ccs=ccsTemp.split(",")[courseIndex];
    let sectionNumber=parseInt(ccs.charAt(ccs.length-1));
    if(sectionNumber==0){
        sectionNumber=determineMustSection(currentCourses[courseIndex]);
    }
    console.log("sectionNumber:"+sectionNumber);
    let sections="<option value=-1>Sections</option>";
    for(let i=0;i<currentCourses[courseIndex]["s"].length;i++){
        let temp=i+1;
        sections+="<option value="+temp+">"+temp+"</option>";
    }
    
    let firstInst="Do not satisfy course requirements"
    let secondInst="Do not statisfy course requirements";
    if(sectionNumber-1<currentCourses[courseIndex]["s"].length){
        firstInst=currentCourses[courseIndex]["s"][sectionNumber-1]["inst"][0];
        secondInst=currentCourses[courseIndex]["s"][sectionNumber*1]["inst"][1];
    }

    let content="<div class=courseInfo>"+
    "<div class=text style=background-color:DarkBlue; align=center><h3>Course Information</h3></div>"+
    "<div><h5 class=serif>"+
    
    currentCourses[courseIndex]["cn"]+
    "</h5>"+
    "</div>"+
    "<div><h5 class=serif>Inst:"+
    
    firstInst+
    "</h5></div>"+
    "<div><h5 class=serif >Inst:"+
    secondInst+
    
    "</h5></div>"+
    
    "<div><select id=section>"+
    sections+
    "</select>"+
    "</div>"+
    "<div>"+
    "<button type=button onclick=changeSection("+ courseIndex+")"+">Change</button>"+
    "</div>"+
    "</div>";
    $("#courseInfo").html(content);
    
    
}
function findName(courseCode){
    for(let i=0;i<allCourses.length;i++){
        if(allCourses[i]["cc"]==courseCode){
            return allCourses[i]["cn"];
        }
    }
    
}
function changeSection(courseIndex){
    

    
    let sectionNo=document.getElementById("section").value;

    let dateTime=currentSchedule.split(":")[0];
    let courses=currentSchedule.split(":")[1].split(",");
    let newCourse=courses[courseIndex].substring(0,courses[courseIndex].length-1)+sectionNo;
    currentSchedule=dateTime+":";
    
    for(let i=0;i<courses.length;i++){
        if(i==courseIndex){
            currentSchedule+=newCourse+",";
            continue;
        }
        currentSchedule+=courses[i]+",";
    }
    
    currentSchedule=currentSchedule.substring(0,currentSchedule.length-1);
    showCourseInfo(courseIndex);
    displayCurrentSchedule();
    

}
function addManuelCourses(){
    
    let userCourse=document.getElementById("course").value.toUpperCase();
    let isCirricular=false;
    if(userCourse==''){
        alert("course field can not be empty");
        return;
    }
    
    
    let day=parseInt(document.getElementById("day").value);
    let startTime=parseInt(document.getElementById("start_time").value);
    let endTime=parseInt(document.getElementById("end_time").value);
    

    
    if(day==-1){
        
        let firstChar=userCourse.charAt(0);
        let key="cc";
        if('A'<=firstChar &&firstChar<='Z') key="cn";
        let i=0;
        for(;i<allCourses.length;i++){
            if(userCourse==allCourses[i][key]){
              break;  
            }
        }
        if(i<allCourses.length){

            //*add course to currentSchedule
            //adjustment for new schedules
            if(currentSchedule.charAt(currentSchedule.length-1)==":")
            {
                currentSchedule+=allCourses[i]["cc"]+"-0"; 
            }
            else
            {
                currentSchedule+=","+allCourses[i]["cc"]+"-0";
            }
            
            
            console.log("new currentSchedule:"+currentSchedule);
            displayCurrentSchedule();
       
        }
        else{
            alert("invalid course information");
        }
    }
    else{
        if(startTime==7||endTime==8){
            alert("should set start-end time");
        }
        else{
            //adjustment for new schedules
            if(currentSchedule.charAt(currentSchedule.length-1)==":"){
                currentSchedule+="?"+userCourse+"t"+day+startTime+"-"+endTime;
            }
            else{
                currentSchedule+=",?"+userCourse+"t"+day+startTime+"-"+endTime;
            }
            
            displayCurrentSchedule();
        }
    }

}

    
var currentSchedule="";
var currentIndex;
var currentCoursesCodes;
var currentCourses=[];
function newSchedule() {
    if(schedules.length ==5 ){
        alert("maximum 5 schedules allowed");
        return;
    }
    
    let dateTime=new Date();
    let schedule=""+dateTime.getDate()+"."+dateTime.getMonth()+"."+dateTime.getFullYear()+"-"+dateTime.getHours()+"."+dateTime.getMinutes();
    
    

    currentSchedule=schedule+":";
    console.log("currentSchedule:"+currentSchedule);
    schedules.push(currentSchedule);
    //userStyle(schedules.length-1);
    currentCoursesCodes=[];
    displayCurrentSchedule();


}

function saveSchedules() {
    schedules[currentIndex]=currentSchedule;
    console.log("schedules:"+schedules);
    
    let map={};
    for(let i =0;i<schedules.length;i++){
        map[i]=schedules[i];
    }
    // send schedules to server

    $.getJSON("/save",map,(info)=>{
        if(info){
            console.log("user schedules saved");
        }
        else{
            console.log("user schedules couldn't save");
        }
        
        
    });
    

}


function displaySchedule(scheduleIndex){
    currentIndex=scheduleIndex;
    currentSchedule=schedules[scheduleIndex];
    currentCoursesCodes=[];
    if(currentSchedule.split(":")[1]!=""){
        currentCoursesCodes=currentSchedule.split(":")[1].split(",");
    }
    displayCurrentSchedule();
}
    // * CLEAN CELLS*/
    function cleanCells(){
        // row ids in  [1,8]
        for(let i=0;i<=8;i++){
            let row=document.getElementById(i).getElementsByTagName("th");
            // column ids in [1,7]
            for(let j=1;j<=7;j++){
                row[j].textContent="";
            }
        }
    }


function displayCurrentSchedule(){
    
    if(isLoggedIn){
        userStyle(0);
        isLoggedIn=false;
    }else{
        userStyle(4);
    }
    

    cleanCells();
    
    if(currentCoursesCodes){
        currentCourses=[];
        createCurrentCourses(currentCourses);
        console.log("currentCourses:"+currentCourses.length);
        for (let i = 0 ; i < currentCourses.length ; i++){
            displayCourse(currentCourses[i],currentCoursesCodes[i].charAt(currentCoursesCodes[i].indexOf("-")+1));
        }
    }
    
    
    
    
    function createCurrentCourses(currentCourses){
        let size=0;
        for(let i=0;i<currentCoursesCodes.length;i++){
            
            //find known course info
            if(currentCoursesCodes[i].charAt(0)!='?'){
                for(let j=0;j<allCourses.length;j++){
                    if(allCourses[j]["cc"]==currentCoursesCodes[i].substring(0,7))
                        currentCourses[size++]=allCourses[j];
                }   
                
            }
            else{
            //find unknown course info
                let dayIndex=currentCoursesCodes[i].indexOf("t");
                let unknown={
                    "t":"not",
                    "cc":currentCoursesCodes[i].substring(1,dayIndex),
                    "day":currentCoursesCodes[i].substring(dayIndex+1,dayIndex+2),
                    "st":currentCoursesCodes[i].substring(dayIndex+2,currentCoursesCodes[i].indexOf("-")),
                    "end":currentCoursesCodes[i].substring(currentCoursesCodes[i].indexOf("-")+1,currentCoursesCodes[i].length)
                };
                currentCourses[size++]=unknown;
            }
         }
    }
}


function displayCourse(course,sectionNo){
    // for unknown courses
    if(course["t"]=="not"){
        let day=course["day"];
        let st=parseInt(course["st"]);
        let end=parseInt(course["end"]);

        changeCells(st,end-st,day,"",course["cc"]);
        
        
    }// for known courses
    else{
        //for must section
        if(sectionNo==0){
            sectionNo=determineMustSection(course);
        }
        
        let sections=course["s"];
        let st=-1;
        let end=-1;
        let place="";
        let inst="";
        let day="";
        let cc=course["cc"];

        for(let i=0;i<sections.length;i++){
            if(sections[i]["sn"]==sectionNo){
                inst=sections[i]["inst"];
                let sessions=sections[i]["ses"];

                for(let j=0;j<sessions.length;j++){
 
                    place=sessions[j]["p"];
                    day=sessions[j]["d"]; 

                    if(sessions[j]["st"]!=null){
                        
                        st=parseInt(sessions[j]["st"].substring(0,2));

                        end=parseInt(sessions[j]["end"].substring(0,2));

                        changeCells(st,end-st,day,place,cc);
                    }
                }
            }
        }
    }
    
}

function changeCells(startTime,hours,day,place,courseCode){
    
    // change day names to correspond numbers
    if(day.length >1){
        if(day=="Monday") day="0";
        else if(day=="Tuesday") day="1";
        else if(day=="Wednesday") day="2";
        else if(day=="Thursday")day="3";
        else if(day=="Friday") day="4";
        else if(day=="Saturday") day="5";
        else if(day=="Sunday") day="6";
    }
    let firstLesson=startTime-8;
    let positions=[];
    for(let i=0;i<hours;i++){
        positions[i]=""+firstLesson+day;
        firstLesson++;

    }

    for(let i=0;i<positions.length;i++){
        
        let courseMix=findMix(courseCode);
        let content="<div>"+ 
            courseMix+
            "-"+
            place
        +"</div>";
        $("#"+positions[i].trim()).append(content);
    }
    
    
    
}
function determineMustSection(course){
    let sections=course["s"];
    let i=0;
    for(;i<sections.length;i++){
        if(isValid(i)) break;
    }
    return i+1;
    
    
 
    function isValid(sectionId){
        
        if(sections[sectionId]["req"]["start"]=="") return true;
        
        let reqLength=sections[sectionId]["req"].length;
        let req=sections[sectionId]["req"];
        let canAddSection=false;
        let start="-1";
        let end="-1";
        let surName=lastName.substring(0,2);
        for(let i=0;i<reqLength;i++){
            if(deptName==req[i]["givendept"]||req[i]["givendept"]=="ALL"){
                start=req[i]["start"];
                end=req[i]["end"];
                
                if(lastName.localeCompare(start)>=0&&end.localeCompare(lastName)>=0){
                    canAddSection=true;

                }
                else canAddSection=false;
            }

        }
        if(start=="-1") return false;
        return canAddSection;    
    
    }
  
}
function findMix(courseCode){
    for(let i=0;i<deptCodesShrtN.length;i++){
        if(deptCodesShrtN[i]["cc"]==courseCode.substring(0,3)){
            return deptCodesShrtN[i]["cn"]+courseCode.substring(4,courseCode.length);
        }
    }
    return courseCode;
}



function deleteCourse (courseIndex){

    currentSchedule.splice(courseIndex,1);
    displayCurrentSchedule();

}

// send /logout to delete user from session
function logOut() {
    $.getJSON('/logout', (output) => {
        if (output) {
            window.location.href = "/";
        }
    });

}



function addMustCourses() {

    let semNo = document.getElementById("semesterNo").value;
    
    //convert deptName to deptCode
    if(dept.charAt(0)>='A'&&dept.charAt(0)<='Z'){
        let size=deptCodesShrtN.length;
        for(let i=0;i<size;i++){
            if(deptCodesShrtN[i]["cn"] == dept){
                dept=deptCodesShrtN[i]["cc"];
            }    
        }    
    }
    
    // read Json file and add must courses to current schedule
    let semMustCourses=mustCourses[dept][semNo];
    let size=semMustCourses.length;
    if(currentSchedule.charAt(currentSchedule.length-1)!=":"){
        for(let i=0;i<size;i++){
            currentSchedule+=","+semMustCourses[i]+"-0";
        }
    }
    else{
        currentSchedule+=semMustCourses[0]+"-0";
        for(let i=1;i<size;i++){
            currentSchedule+=","+semMustCourses[i]+"-0";
        }
    }

    displayCurrentSchedule();
}

// check semester user-input 
function checkSem() {

    let semOld = $("#semesterNo").val();

    document.getElementById("body").addEventListener("click", () => {
        let semNew = $("#semesterNo").val();
        $("#semdiv2").html("<button id=mustCourses type=button  onclick=addMustCourses() disabled>Add</button>");
        $("#image").removeAttr("src");
        // check value of the semester is changed
        if (semOld != semNew) {
            semOld = semNew;

            // check valid user input
            if (semNew < 0 || semNew < 1 || semNew > 8 || Math.round(semNew) != semNew) {
                // add html cross image and imply the reason of not validation
                $("#image").attr("src", "static/cross.png");

            } else {
                //add html tik image
                $("#image").attr("src", "static/tik.jpg")
                $("#mustCourses").removeAttr("disabled");
            }

        } 


    });

}