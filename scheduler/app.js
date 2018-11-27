
//Node dan express'i import ediyor
var express = require('express');

//expressi app objesine atıyor
var app = express();

// import cookieSession
var cookieSession = require('cookie-session');

//current directory'i çekiyor
var path    = require("path");

//Database connection
const sqlite3 = require('sqlite3').verbose();

//File sharing
app.use('/static', express.static('public'));


//8080 portuna gelen requestleri listenlıyor 
app.listen(8080, function () {
  console.log('Scheduler listening on port 8080!');
});


// Express configuration for session
app.use(cookieSession({
    keys: ['metu']
}));

// get database connection
let db = new sqlite3.Database('./earlyornot.db',err => {
  
  if(err){
    console.log("Database connection not created");
  }
  else{
    console.log("Database connection created");
  }
});

var session = [];

//router
app.get('/',(request, response) => {
    //render_template
  response.sendFile(path.join(__dirname+'/templates/index.html'));
  
});

//router
app.get('/known',(request,response)=>{
  
  let isLoggedIn = false;

  let userId = request.session.user_id;
  let output;

  for(let i=0;i<session.length;i++){
    if(userId==session[i]){
      isLoggedIn=true;
      break;
    }
  }

 db.all('SELECT * FROM users WHERE id=?',[userId],(err,rows)=>{

    if (isLoggedIn)
    {
      let lastName=rows[0].lastname;
      let department=rows[0].department;
      let username=rows[0].email;
      let schedules=[]; 

      db.all('SELECT users.id,schedules.schedule FROM users INNER JOIN schedules ON users.id=schedules.id WHERE users.id=?',[request.session.user_id],(err,rows)=>{
        if(err){
          console.log(err);
        }
        else{
          let size=rows.length;
          for(let i=0;i<size&&rows[i].schedule!=null;i++){
            console.log(rows[i].schedule);
            schedules.push(rows[i].schedule);
          }
        }
        

        output={
          "isValid":isLoggedIn,
          "schedules":schedules,
          "username":username,
          "lastname":lastName,
          "department":department
        };
        response.send(output);
      });    
    }
    else
    {
      output={
        "isValid":false
      };
      response.send(output);
    }

  });

 
});


app.get('/login',(request,response)=>{

  //confirm user information is valid
  let email = request.query.email;

  let password = request.query.password;
    let isValid;
    let info;
    let schedules=[];
    let lastName;
  db.all('SELECT * FROM users WHERE email=?',[email],(err,rows)=>{

    if (rows.length!=0&&password == rows[0].password)
    {
      isValid = true;
      session.push(rows[0].id);
      request.session.user_id = rows[0].id;

      lastName=rows[0].lastname;
      let dept=rows[0].department;
      db.all('SELECT users.id,schedules.schedule FROM users INNER JOIN schedules ON users.id=schedules.id WHERE users.id=?',[request.session.user_id],(err,rows)=>{
        if(err){
          console.log("/login inner join statement error");
        }
        else{
          let size=rows.length;
          for(let i=0;i<size&&rows[i].schedule!=null;i++){

            schedules.push(rows[i].schedule);

          }
        }

        info={
          "isValid":isValid,
          "lastName":lastName,
          "schedules":schedules,
          "department":dept
        };
        response.send(info);
      });    
    }
    else
    {
      info={
        "isValid":false
      };
      response.send(info);
    }

  });
      

});


app.get('/logout',(request,response)=>{
  
  // remove user id from session array  
  let index = session.indexOf(request.session.user_id);
  session.splice(index,1);
  response.send(JSON.stringify(true));
});


app.get('/save',(request,response)=>{

  
  let schedules=request.query;
  let size=0;
  while(schedules[size]!=null){

    size++;
  }


  
  db.all("SELECT * FROM schedules WHERE id=?",[request.session.user_id],(error,rows)=>{
    let recorded=rows.length;

    for(let i=0;i<recorded&&i<size;i++){

      db.all("UPDATE schedules SET schedule=? WHERE no=? AND id=?",[schedules[i],i,request.session.user_id],(err)=>{
        if(err){
          console.log(err);
        }
        else{
          console.log("user saved");
        }
      });
     if(recorded>size){
        //set schedule null
        let update="UPDATE schedules SET schedule=null WHERE id="+request.session.user_id+"AND no="+size++;
        db.all(update);
        
      }
    }
    for(let i=recorded;i<size;i++){
      db.all("INSERT INTO schedules (id,no,schedule) VALUES (?,?,?)",[request.session.user_id,i,schedules[i]]);
    }
    
  });
  let output=true;
  response.send(output);
  
  
});

app.get('/courses',function(request,response){
  
  response.setHeader("Content-Type", "application/json; charset=ISO-8859-9");
  response.sendFile(path.join(__dirname+'/public/allCourses.json'));
  
});


app.get('/record', function (request,response) {
  
  // receive data
  let email = request.query.email;
  let password = request.query.password;
  let surname = request.query.surname;
  /**
   * departmentıda database e ekle 
   * 
  */
  let deptCode = request.query.department;

  
  //INSERT USER INTO users
  db.run('INSERT INTO users(email,password,lastname,department) VALUES(?,?,?,?)',[email,password,surname,deptCode],(err)=>{
    if(err){
      console.log(err.message);
      response.send(JSON.stringify(false));
    }

    else{
      console.log("USER SUCCESSFULLY SAVED DATABASE");
      

      
      // TAKE USER ID AND PUT IN SESSION
      db.all('SELECT * FROM users WHERE email=?',[email],(err,row)=>{
        let output;
        if(err)
        {
          console.log(err.message);
        }
        else
        {
          session.push(row[0].id);
          request.session.user_id = row[0].id;
          console.log("Online user:"+session.length);
      
            output =
            {
              permission : true,
            };
        }
        response.send(output);
   
      });
    } 
  });
});
  

