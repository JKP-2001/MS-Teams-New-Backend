import mongoose from "mongoose";

const filesSchema = {
  files:{type:String,require:true},
  name:{type:String,require:true},
  type:{type:String,require:true},
}

const submission = {
  userId: 
    { type: mongoose.Schema.Types.ObjectId },
  
  material: [filesSchema],
  dateTime: {
    type: Date,
  },
  feedBack: {
    type: String,
  },
  points: {
    type: Number,
  },
  returned: {
    type: Date,
  },
  isReturned: {
    type: Boolean,
    default:false
  },
};
const assignmentScchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  grpId: {
    type:  mongoose.Schema.Types.ObjectId ,
    require:true
  },
  createdBy: {
    type:  mongoose.Schema.Types.ObjectId ,
    require:true
  },
  instructions: {
    type: String,
    default: "",
  },
  points: {
    type: Number,
  },
  files: [filesSchema],
  turnedInBy: [{
     type: mongoose.Schema.Types.ObjectId, default: [] }],
  dueDateTime: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  submission: [submission],
});

const Assignment = mongoose.model("Assignment", assignmentScchema);
export {Assignment}
