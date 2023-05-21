/* The above code is a module that exports several functions related to managing assignments in a
group-based learning management system. The functions include creating a new assignment, deleting an
assignment, getting a particular assignment, getting all assignments of a user, and editing an
assignment. These functions use various models such as Assignment, groupModel, GrpItems, and User to
perform CRUD operations on the database. The functions also handle file uploads and deletions, and
assign/unassign assignments to/from group members. The code uses async/await to handle asynchronous
operations and returns JSON responses to the client. */


import mongoose from "mongoose";
import { Assignment } from "../models/Assignment.js";
// import { groupModel } from "../Models/Group.js";
import { groupAssignmentModel } from "../models/GrpItems.js";
import { groupModel } from "../models/Group.js";
import { user as User } from "../models/User.js";

import fs from "fs"


let OWNER;
let ADMINS;


/**
 * This function assigns an assignment to all members in an array, except for the owner and admins.
 * @param membersArr - an array of member IDs to whom the assignment needs to be assigned.
 * @param assId - The ID of the assignment that needs to be assigned to all members in the membersArr
 * array.
 */
const assignToAllMembers = async (membersArr, assId) => {
    const p = membersArr.length;

    for (let i = 0; i < p; i++) {
        const mem_id = membersArr[i];
        const user = await User.findById(mem_id);
        if (user) {
            if (String(OWNER) === String(user._id) || ADMINS.includes(user._id)) {
                continue;
            }
        }
        if (user) {
            let assignmentsAssign = user.assignmentsAssign;
            assignmentsAssign.push(assId);
            await User.findByIdAndUpdate(mem_id, { assignmentsAssign });
        }
    }
}

/**
 * The function unassigns a specific assignment from all members in a given array.
 * @param membersArr - an array of member IDs
 * @param assId - The ID of an assignment that needs to be unassigned from all members in the
 * `membersArr` array.
 */
const unassingToAll = async (membersArr, assId) => {
    const p = membersArr.length;

    for (let i = 0; i < p; i++) {
        const mem_id = membersArr[i];
        const user = await User.findById(mem_id);
        if (user) {
            let assignmentsAssign = user.assignmentsAssign;
            if (assignmentsAssign.includes(assId)) {
                assignmentsAssign.splice(assignmentsAssign.indexOf(assId), 1);
                await User.findByIdAndUpdate(mem_id, { assignmentsAssign });
            }
        }
    }
}

/**
 * This function retrieves assignments and their corresponding group names.
 * @param assignmentsAssign - It is an array of assignment IDs that need to be retrieved from the
 * database.
 * @returns The function `getTheAssignments` is returning an array of objects that represent
 * assignments. Each object contains information about an assignment, including its ID, name,
 * description, due date, and the name of the group it belongs to. The assignments are retrieved from
 * the database using their IDs, which are passed as an argument to the function. The function uses the
 * `findById` method to retrieve each assignment
 */
const getTheAssignments = async (assignmentsAssign) => {
    const len = assignmentsAssign.length;
    var result = [];
    for (let i = 0; i < len; i++) {
        let item = await Assignment.findById(assignmentsAssign[i]);
        const grp = await groupModel.findById(item.grpId);
        if (grp) {
            if (item) {
                item = JSON.parse(JSON.stringify(item));
                item["grp_name"] = grp.name;
                result.push(item);
            }
        }
    }

    return result;
}


/**
 * This function creates a new assignment and adds it to a group's list of assignments.
 * @param req - req is an object that represents the HTTP request made by the client to the server. It
 * contains information such as the request method, request headers, request body, and request
 * parameters.
 * @param res - `res` is the response object that is used to send a response back to the client making
 * the request. It contains methods like `status()` to set the HTTP status code, `json()` to send a
 * JSON response, and `send()` to send a plain text response.
 */
const createNewAssignment = async (req, res) => {
    try {

        
        const grpDetails = req.body.groupDetails;
        
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
            createdBy: user._id
        }

        OWNER = grpDetails.owner;
        ADMINS = grpDetails.admins;

        const newAss = await Assignment.create(newAssignment);
        var assignmentsPosted = grpDetails.assignmentsPosted;
        assignmentsPosted.push(newAss._id);
        const updateGrp = await groupModel.findByIdAndUpdate(grpDetails._id, { assignmentsPosted })
        await assignToAllMembers(updateGrp.members, newAss._id);
        res.status(200).json({ success: true, details: newAss });
    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}

/**
 * This function deletes an assignment from the database and returns a success message if the deletion
 * is successful.
 * @param req - req is an object that represents the HTTP request made by the client to the server. It
 * contains information such as the request method, headers, URL, and any data sent in the request
 * body.
 * @param res - The "res" parameter is the response object that will be sent back to the client making
 * the request. It contains methods and properties that allow the server to send a response back to the
 * client, such as setting the status code, sending data, and setting headers.
 */
const deleteAnAssignment = async (req, res) => {
    try {

        const grpDetails = req.body.groupDetails;
        const user = req.body.userDetails;
        const assDetails = req.body.assDetails;

        const deleteItem = await Assignment.findByIdAndDelete(assDetails._id);
        if (deleteItem) {
            await unassingToAll(grpDetails.members, assDetails._id);
            let assignmentsPosted = grpDetails.assignmentsPosted;
            if (assignmentsPosted.includes(assDetails._id)) {
                assignmentsPosted.splice(assignmentsPosted.indexOf(assDetails._id), 1);
                await groupModel.findByIdAndUpdate(grpDetails._id, { assignmentsPosted });
            }
            res.status(200).json({ success: true, details: `Successfully Deleted by ${user.email}.` });
        }

    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}

const getAParticularAssignment = async (req, res) => {
    try {
        const grpDetails = req.body.groupDetails;
        const user = req.body.userDetails;
        const postId = req.params.id;

        const post = await Assignment.findById(postId);
        if (!post) {
            throw new Error("Assignment Doesn't Exist.")
        }



        res.status(200).json({ success: true, details: post });
    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}

/**
 * This function retrieves all assignments assigned to a user, sorts them by due date, and returns them
 * in a JSON response.
 * @param req - req stands for request and it is an object that contains information about the HTTP
 * request that was made, such as the URL, headers, and any data that was sent in the request body. It
 * is passed as the first parameter to this function.
 * @param res - The `res` parameter is the response object that will be sent back to the client with
 * the HTTP response. It contains methods to set the status code, headers, and body of the response.
 * @returns This function returns a list of all assignments assigned to a user, sorted by their due
 * date and time. The response is in JSON format with a success flag and the details of the
 * assignments. If there is an error, it returns a JSON response with a success flag set to false and
 * an error message.
 */
const getAllAssignmentOfAUser = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            throw new Error("User Not Found");
        }

        const assignmentsAssign = user.assignmentsAssign;

        let allAssignments = await getTheAssignments(assignmentsAssign);

        allAssignments.sort(function (a, b) {
            return (a.dueDateTime < b.dueDateTime) ? -1 : ((a.dueDateTime > b.dueDateTime) ? 1 : 0);
        });

        res.status(200).json({ success: true, details: allAssignments });

    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}


/**
 * This function edits an assignment by adding or deleting files and updating its title, instructions,
 * and due date.
 * @param req - req is the request object that contains information about the HTTP request made by the
 * client, such as the request parameters, headers, and body.
 * @param res - The "res" parameter is the response object that will be sent back to the client after
 * the function is executed. It contains information such as the status code and any data that needs to
 * be sent back to the client.
 * @returns either a success message with a status code of 200 if the assignment was updated
 * successfully, or an error message with a status code of 400 if there was an error during the update
 * process.
 */
const editAssignment = async (req, res) => {
    try {

        const deletedItem = req.body.deletedItems;
        const assId = req.params.assId;
        const assignment = await Assignment.findById(assId);
        
        if(!assignment){
            throw new Error("Assignment Not Found");
        }
        
        const user_temp = req.user;
        const user = await User.findOne({email:user_temp.email});
        
        if(!user){
            throw new Error("User not found.");
        }

        const assignmentGrp = await groupModel.findById(assignment.grpId);
        if(!assignmentGrp){
            throw new Error("Assignment's grp not found");
        }

        if(!assignmentGrp.members.includes(user._id) && String(assignmentGrp.owner)!==String(user._id)){
            throw new Error("Not authorized to edit the assignment.");
        }

        let files = assignment.files;
        
        if(req.files && req.files.length>0){
            for (let i = 0; i < req.files.length; i++) {
                const newPath = req.files[i].path.replace(/\\/g, '/');
                const entry = {
                    files:newPath,
                    name:req.files[i].originalname,
                    type:req.files[i].mimetype
                }
                files.push(entry);
            }   
        }

        if(deletedItem && deletedItem.map((item_obj)=>{
            fs.unlinkSync(item_obj);
        }))

        if(deletedItem){
            files.map((item_obj,i)=>{
                if(deletedItem.includes(item_obj.files)){
                    files.splice(i,1);
                }
            })
        }
        
        const updateAssignment = await Assignment.findByIdAndUpdate(assignment._id,{
            title:req.body.title?req.body.title:assignment.title,
            instructions:req.body.instructions?req.body.instructions:assignment.instructions,
            files:files, 
            dueDateTime:req.body.deadline?req.body.deadline:assignment.dueDateTime});
        if(updateAssignment){
            res.status(200).json({ success:true, details:"Assignment updated successfully." });
        }
        return;
    } catch (err) {
        res.status(400).json({ success: false, err: err.toString() });
    }
}

export { createNewAssignment, getAParticularAssignment, deleteAnAssignment, getAllAssignmentOfAUser, editAssignment}