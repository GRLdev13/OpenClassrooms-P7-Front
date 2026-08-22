export class Message
{
    id : string = "";
    name : string = "";
    message : string = "";
    timeStamp : Date = new Date();
    id_conversation :  string = "";
    id_sender :  string = "";
    status : string = ""; // recieved or not ?
}
