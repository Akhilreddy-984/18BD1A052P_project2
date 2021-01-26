const express=require('express');
const app=express();
app.use(express.json());
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'issueTrackingSystem';

const userInfoCollection='userDetails';
const troubleCollection="troubleReport";
let db=null;
MongoClient.connect(url, function(err, client) {
  if(err)
  {
      console.log("Error in connecting to server");
  }
  console.log("Connected successfully to server");
  console.log(`Database:${dbName}`);
 
   db = client.db(dbName);
 
});
function generate(){
    var alnum="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    var Tic="";
    for(var i=0;i<6;i++)
    {
            Tic+=alnum[Math.floor(Math.random()*alnum.length)]
    }
    return Tic;
}
app.post('/api/IdentifyUserByMobNumber',(req,res)=>{
    var num=req.query.mobNumber;
    db.collection(userInfoCollection).find({mobNumber: num}).toArray((err,documents)=>{
        if(err)
        {
            console.log(err);
        }
        else{
            res.send("Hi Mr. "+documents[0].username+" How can we help you?");
        }
    });

});

app.put('/api/RegisterIssue',(req,res)=>{

    const mob=req.body.mobNumber;
    const issue=req.body.issueDesc;
    const stat=req.body.status;
    const tic=generate();
    //console.log(str);
    db.collection(troubleCollection).findOneAndUpdate({mobNumber:mob},{$set:{status:stat,ticket:tic,issueDesc:issue}},{returnOriginal:false},(err,result)=>{
        if(err)
          console.log("error");
        else
            res.send("status updated");
    })

});


app.listen(3000,()=>console.log('listening on:3000..'))

