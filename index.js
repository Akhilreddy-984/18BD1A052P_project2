const express=require('express');
const diff=require('dialogflow-fulfillment');
const { Payload } =require("dialogflow-fulfillment");
const app=express();
app.use(express.json());
const MongoClient = require('mongodb').MongoClient;
var user_name="";
var acct_num="";
const url = 'mongodb://localhost:27017';
const dbName = 'issueTrackingSystem';

const userInfoCollection='userDetails';
const troubleCollection="troubleReport";

function generate(){
    var alnum="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    var Tic="";
    for(var i=0;i<6;i++)
    {
            Tic+=alnum[Math.floor(Math.random()*alnum.length)]
    }
    return Tic;
}
app.get('/',(req,res)=>{
    res.send("We are live");

})
app.post('/dialogflow',express.json(),(req,res)=>{
    const agent=new diff.WebhookClient({
        request:req,
        response:res
    });
    async function changeNumber(agent)
    {
         var num =JSON.stringify(agent.parameters.numb);
        const client = new MongoClient(url,{useUnifiedTopology: true});
        await client.connect();
        const ans=await client.db(dbName).collection(userInfoCollection).findOneAndUpdate({username:user_name},{$set:{mobNumber:num}},{returnOriginal:false},(err,result)=>{
            if(err)
              console.log("error");
            else
                console.log(result);
        });
        const ans2=await client.db(dbName).collection(troubleCollection).findOneAndUpdate({username:user_name},{$set:{mobNumber:num}},{returnOriginal:false},(err,result)=>{
            if(err)
              console.log("error");
            else
                console.log(result);
        });
        //console.log(ans);
        await agent.add("Details updated !!\n Thankyou😊 ");
        
    }
    async function getStatus(agent)
    {
        var curr_stat="";
        const client = new MongoClient(url,{useUnifiedTopology: true});
        await client.connect();
        const snap = await client.db(dbName).collection(troubleCollection).findOne({mobNumber: acct_num});
        console.log(snap);
        if(snap==null)
        {
	        await agent.add("There is no Registered issue");

        }
        else
        {
            var curr_stat=snap.status;
            console.log(curr_stat);
            await agent.add("This may take few seconds..");
            //
            await agent.add("Your ticket status is "+curr_stat+"\n Registered on: "+snap.time_date);
            await agent.add("Are you satisfied with the Response?");


            
        }
    
    }
    async function IdentifyUserByMobNumber(agent)
    {
         acct_num =JSON.stringify(agent.parameters.number);
         console.log(acct_num);
        const client = new MongoClient(url,{useUnifiedTopology: true});
        await client.connect();
        const snap = await client.db(dbName).collection(userInfoCollection).findOne({mobNumber: acct_num});
        console.log(snap);
        if(snap==null)
        {
	        await agent.add("Re-Enter your account number");

        }
        else
        {
            user_name=snap.username;
            console.log(user_name);
            await agent.add("Welcome  "+user_name+"!!  \n How can I help you");
            await agent.add("check status or Internet issue");
        }
    }
    function custom_payload(agent)  
    {
	    var payLoadData=
		{
            "richContent": 
            [
                [
                    {
                        "type": "list",
                        "title": "Internet Down",
                        "subtitle": "Press '1' for Internet is down",
                        "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "Slow Internet",
                        "subtitle": "Press '2' Slow Internet",
                        "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "Buffering problem",
                        "subtitle": "Press '3' for Buffering problem",
                        "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "No connectivity",
                        "subtitle": "Press '4' for No connectivity",
                        "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                        }
                    }
                ]
            ]
        }
        agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
    }

    function report_issue(agent)
    {
    
        var issue_vals={"1":"InternetDown","2":"Slow Internet","3":"Buffering problem","4":"No connectivity"};
        
        const intent_val=JSON.stringify(agent.parameters.number);
        console.log(typeof(intent_val));
        
        var val=issue_vals[intent_val];
        console.log(val);
        
        var trouble_ticket=generate();

        //Generating trouble ticket and storing it in Mongodb
        //Using  generate() method
        MongoClient.connect(url, {useUnifiedTopology: true},function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbName);
            
            var u_name = user_name;    
            var issue_val=  val; 
            var status="pending";

            let ts = Date.now();
            let date_ob = new Date(ts);
            let date = date_ob.getDate();
            let month = date_ob.getMonth() + 1;
            let year = date_ob.getFullYear();

            var time_date=year + "-" + month + "-" + date;

            var myobj = { mobNumber:acct_num,issueDesc:issue_val,status:status,ticket:trouble_ticket,time_date:time_date,username:u_name};

            dbo.collection(troubleCollection).insertOne(myobj, function(err, res) {
            if (err) throw err;
            db.close();    
        });
        });
        agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
    }

        var intentMap=new Map();
        intentMap.set("IdentifyUser",IdentifyUserByMobNumber);
        intentMap.set("Check_Status",getStatus);
        intentMap.set("Service_Intent",custom_payload);
        intentMap.set("Service_Ticket_Generate", report_issue);
        intentMap.set("UpdateMobileNumber",changeNumber);
        agent.handleRequest(intentMap);

})

app.post('/api/IdentifyUserByMobNumber',(req,res)=>{
    var num=req.query.mobNumber;
    db.collection(userInfoCollection).find({mobNumber: num}).toArray((err,documents)=>{
        if(err)
        {
            console.log(err);
        }
        else{
            res.send("Hi Mr. "+documents[0].username+" How can I help you?");
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

