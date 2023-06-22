import mongoose from "mongoose";

import {user as User } from "../models/User.js";
import { groupModel } from "../models/Group.js";
import { Assignment } from "../models/Assignment.js";


const checkForAssignment = async(req,res,next)=>{
    try{
        const loggeduser = req.user;
        const user = await User.findOne({email:loggeduser.email}).select("-password -creationDateAndTime, -loginDates -checkReset -lastotp");
        if(!user){
            throw new Error("User Not Found");
        }

        const assignmentId = req.body.assignmentId;
        
        const assignment = await Assignment.findById(assignmentId);
        
        if(!assignment){
            throw new Error("Assignment Not Found.");
        }

        const ownerEmail = assignment.createdBy;
        const owner = await User.findById(ownerEmail).select("-password -creationDateAndTime, -loginDates -checkReset -lastotp");

        if(!owner){
            throw new Error("Owner Not Found");
        }

        
        
        const grpId = assignment.grpId;
        const grp = await groupModel.findById(grpId);
        if(!grp){
            throw new Error("Group Not Found");
        }

        
        if(String(grp.owner) !== String(user._id) && String(user._id)!==String(assignment.createdBy)){
            
            throw new Error("Not Authorized.");
        }

        req.body.groupDetails = grp;
        req.body.userDetails = user;
        req.body.assDetails = assignment;
        next();

    }catch(err){
        res.status(400).json({success:false, error:err.toString()})
    }
}


export default checkForAssignment;