import mongoose from "mongoose";
import { Assignment } from "../models/Assignment.js";
// import { groupModel } from "../Models/Group.js";
import { groupAssignmentModel } from "../models/GrpItems.js";
import { groupModel } from "../models/Group.js";
// import { User } from "../models/User";

// var fs = require('fs');
// var dir = './tmp';

// if (!fs.existsSync(dir)){
//     fs.mkdirSync(dir);
// }

const createNewAssignment = async (req, res) => {
    try {

        // const user = await User.findOne({ email: req.user.email });
        // if (!user) {
        //     throw new Error("User doesn't exist.");
        // }

        // const grpId = req.body.grp_id;
        // const grpDetails = await groupModel.findById(grpId);
        // if (!grpDetails) {
        //     throw new Error("Grp doesn't exists.");
        // }

        // if(toString(grpDetails.owner) !== toString(user._id) && !grpDetails.admins.includes(user._id)){
        //     throw new Error("Only Admins can create a new assignment");
        // }
        // console.log({body:req.body})
        const grpDetails = req.body.groupDetails;
        // console.log({grpDetails})
        const user = req.body.userDetails;

        var files = [];
        for (let i = 0; i < req.files.length; i++) {
            const newPath = req.files[i].path.replace(/\\/g, '/');
            const entry = {
                files: newPath,
                name: req.files[i].originalname,
                type: req.files[i].mimetype
            }
            files.push(entry);
        }

        const newAssignment = {
            title: req.body.title,
            grpId: grpDetails._id,
            instructions: req.body.instructions,
            points: req.body.points,
            files: files,
            dueDateTime: req.body.deadline,
            createdAt: Date.now(),
            submission: [],
            createdBy:user._id
        }

        const newAss = await Assignment.create(newAssignment);
        var assignmentsPosted = grpDetails.assignmentsPosted;
        assignmentsPosted.push(newAss._id);
        const updateGrp = await groupModel.findByIdAndUpdate(grpDetails._id,{assignmentsPosted})
        res.status(200).json({success:true, details:newAss});
    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}

const getAParticularAssignment = async(req,res)=>{
    try{
        const grpDetails = req.body.groupDetails;
        const user = req.body.userDetails;
        const postId = req.params.id;

        const post = await Assignment.findById(postId);
        if(!post){
            throw new Error("Assignment Doesn't Exist.")
        }
        
        res.status(200).json({success:true, details:post});
    }catch(err){
        res.status(400).json({ success:false, error: err.toString() });
    }
}

export {createNewAssignment, getAParticularAssignment}