import mongoose from "mongoose";

/* This code is defining a Mongoose schema for a group. It specifies the various fields that a group
document will have, such as name, description, joining code, owner, admins, members, etc. Each field
has a specified data type and default value. The schema is then used to create a Mongoose model
called `groupModel`, which can be used to interact with the database collection for groups. */


const groupSchema = new mongoose.Schema({
    name:{type:String, required:true},
    description:{type:String,},
    joiningCode:{type:String, required:true},
    owner:{type:mongoose.Schema.Types.ObjectId},
    admins:[{type:mongoose.Schema.Types.ObjectId, default:[]}],
    members:[{type:mongoose.Schema.Types.ObjectId, default:[]}],
    isPublic:{type:Boolean, default:false},
    itemsPosted:[{type:mongoose.Schema.Types.ObjectId, default:[]}],
    meetingPosted:[{type:mongoose.Schema.Types.ObjectId, default:[]}],
    assignmentsPosted:[{type:mongoose.Schema.Types.ObjectId, default:[]}],
    logo:{type:String, default:''},
    createdDateAndTime:{type:Date,required:true}
})

const groupModel = mongoose.model("Group",groupSchema);

export {groupModel};