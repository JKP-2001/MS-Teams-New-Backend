import express from "express"
import mongoose from "mongoose"
import fs from "fs";
import { generateGrpCode, ReadAppend } from "../functions.js";
import { groupModel } from "../models/Group.js"
import { user as User } from "../models/User.js";
import { groupPostModel, scheduleMeetModel } from "../models/GrpItems.js";
import { Assignment } from "../models/Assignment.js";

const file = 'APILogs.txt'
const BASE_URL = process.env.BASE_URL

//Function to extract groups
async function getAllGroupsFromArray(grpArray) {
    let array = [];
    for (let i = 0; i < grpArray.length; i++) {
        const grp = await groupModel.findById(grpArray[i])
        if (grp) {
            array.push(grp);
        }
    }
    return array;
}

function custom_sort(a, b) {
    return new Date(a.dueDateTime) - new Date(b.lastUpdated);
}

//Function to extract member
async function getAllMembersFromArray(memberArray) {
    let array = [];
    for (let i = 0; i < memberArray.length; i++) {
        const grp = await User.findById(memberArray[i]).select("firstName lastName email");
        if (grp) {
            array.push(grp);
        }
    }
    return array;
}


async function getAssignmentArray(assignmentsPosted) {
    let array = [];
    for (let i = 0; i < assignmentsPosted.length; i++) {
        const grp = await Assignment.findById(assignmentsPosted[i]);
        if (grp) {
            array.push(grp);
        }
    }
    return array;
}


async function getItemFromArray(grpItems) {
    var array = [];
    for (let i = 0; i < grpItems.length; i++) {
        var item = await groupPostModel.findById(grpItems[i]);
        if (item) {
            const owner = await User.findById(item.details.postedBy).select('firstName lastName email');
            if (owner) {

                item = JSON.parse(JSON.stringify(item));
                item.owner = owner
                array.push(item);
                continue;
            }
        }
        item = await scheduleMeetModel.findById(grpItems[i]);
        if (item) {
            const owner = await User.findById(item.details.postedBy).select('firstName lastName email');
            if (owner) {
                item = JSON.parse(JSON.stringify(item));
                item.owner = owner
                array.push(item);
                continue;
            }
        }
    }
    return array;
}




const getAllGroups = async (req, res) => {
    try {
        const query = req.query.type;
        let allGroups = [];
        if (query === "public") {
            allGroups = await groupModel.find({ isPublic: true });
        }
        else if (query === "private") {
            allGroups = await groupModel.find({ isPublic: false });
        }
        else if (query === "all") {
            allGroups = await groupModel.find({});
        }
        else {
            throw new Error("type required in query")
        }
        ReadAppend(file, `GET: ${BASE_URL}/group/allgroups called by user at ${Date.now()}\n`)
        res.status(200).json({ success: true, details: allGroups });
        return;
    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}

const getUserGroups = async (req, res) => {
    try {
        const loggeduser = req.user;
        const user = await User.findOne({ email: loggeduser.email });
        if (!user) {
            throw new Error("User Not Found");
        }
        const userGrpArray = user.memeberGrps;
        const result = await getAllGroupsFromArray(userGrpArray);
        ReadAppend(file, `GET: ${BASE_URL}/group/userallgroups called by user ${user.email} at ${Date.now()}\n`);
        res.status(200).json({ success: true, details: result });
        return;

    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() })
    }
}

/**
 * This is an asynchronous function that adds or deletes admins from a group based on the query
 * parameter passed in the request.
 * @param req - The request object containing information about the HTTP request made by the client,
 * such as the request parameters, headers, and body.
 * @param res - The "res" parameter is the response object that will be sent back to the client with
 * the result of the function execution.
 * @returns The function `addAdmins` returns either a success message with details in JSON format or an
 * error message in JSON format.
 */
const addAdmins = async (req, res) => {
    try {
        const grpid = req.params.grpid;
        const grp = await groupModel.findById(grpid);
        const query = req.query.action;
        if (!grp) {
            throw new Error("Group not found.");
        }
        const loggeduser = req.user;
        const user = await User.findOne({ email: loggeduser.email });
        if (!user) {
            throw new Error("User Not Found");
        }

        if (query === "add") {
            ReadAppend(file, `PATCH: ${BASE_URL}/group/admin?action=add called by user ${user.email} at ${Date.now()}\n`);

            if (String(grp.owner) === String(user._id) || grp.admins.includes(user._id)) {
                const reqUser = req.body.email;
                const isUser = await User.findOne({ email: reqUser });
                if (!isUser) {
                    throw new Error("Requested user doens't exist.")
                }
                if (!grp.members.includes(isUser._id)) {
                    throw new Error("Requested user not existed in the group.")
                }
                let admins = grp.admins;
                if (admins.includes(isUser._id)) {
                    throw new Error("User Already An Admin.")
                }
                admins.push(isUser._id);
                const updatedGrp = await groupModel.findByIdAndUpdate(grpid, { admins: admins });
                if (updatedGrp) {
                    res.status(200).json({ success: true, details: `${req.body.email} Added Successfully` });
                    return;
                }
            }
            throw new Error("Only admins can add other as admin.")
        }

        else if (query === "delete") {
            ReadAppend(file, `PATCH: ${BASE_URL}/group/admin?action=delete called by user ${user.email} at ${Date.now()}\n`);

            if (String(grp.owner) === String(user._id) || grp.admins.includes(user._id)) {
                const reqUser = req.body.email;
                const isUser = await User.findOne({ email: reqUser });
                if (!isUser) {
                    throw new Error("Req user doesn't exist.")
                }
                if (!isUser.memeberGrps.includes(grp._id) || !grp.members.includes(isUser._id)) {
                    throw new Error("Requested user not existed in the group.")
                }
                if (!grp.admins.includes(isUser._id)) {
                    throw new Error("Requested email is not an admin.")
                }
                if (String(isUser._id) === String(grp.owner)) {
                    throw new Error("Can remove owner from the admin.")
                }
                let admins = grp.admins;
                admins.splice(admins.indexOf(isUser._id), 1);
                const updatedGrp = await groupModel.findByIdAndUpdate(grpid, { admins: admins });
                if (updatedGrp) {
                    res.status(200).json({ success: true, details: `${req.body.email} deleted Successfully` });
                    return;
                }
            }
            throw new Error("Only admins can add delete other admin.")
        }
        // else if(query === "undefined"){}

    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() })
    }
}

const addUserToGroup = async (req, res) => {
    try {

        const grpid = req.params.grpid;
        const grp = await groupModel.findById(grpid);
        const query = req.query.action;
        if (!grp) {
            throw new Error("Group not found.");
        }
        const loggeduser = req.user;
        const user = await User.findOne({ email: loggeduser.email });
        if (!user) {
            throw new Error("User Not Found");
        }

        if (query === "add") {
            ReadAppend(file, `PATCH: ${BASE_URL}/group/member?action=add called by user ${user.email} at ${Date.now()}\n`);

            if (String(grp.owner) === String(user._id) || grp.admins.includes(user._id)) {
                const reqUser = req.body.email;

                const isUser = await User.findOne({ email: reqUser });
                
                if (!isUser) {
                    throw new Error("Requested user doens't exist.")
                }

                let members = grp.members;

                if (members.includes(isUser._id)) {
                    throw new Error("User Already Exisited In the Group.")
                }
                
                members.push(isUser._id);

                let assignmentsPosted = grp.assignmentsPosted;
        
                let assignmentsAssign = user.assignmentsAssign;

                for(let i = 0;i<assignmentsPosted.length;i++){
                    assignmentsAssign.push(assignmentsPosted[i]);
                }

                const updatedGrp = await groupModel.findByIdAndUpdate(grpid, { members: members });

                if (updatedGrp) {
                    let memeberGrps = isUser.memeberGrps;
                    memeberGrps.push(grp._id);
                    const updateUser = await User.findByIdAndUpdate(isUser._id, { memeberGrps, assignmentsAssign })
                    res.status(200).json({ success: true, details: `${req.body.email} Added Successfully` });
                    return;
                }
            }
            throw new Error("Only admins can add other members.")
        }

        else if (query === "delete") {
            ReadAppend(file, `PATCH: ${BASE_URL}/group/member?action=delete called by user ${user.email} at ${Date.now()}\n`);



            if (String(grp.owner) === String(user._id) || grp.admins.includes(user._id) || req.body.email === req.user.email) {

                const reqUser = req.body.email;
                const isUser = await User.findOne({ email: reqUser });

                if (!isUser) {
                    throw new Error("Requested user doens't exist.")
                }

                let members = grp.members;


                if (!members.includes(isUser._id)) {
                    throw new Error("User Not Exisited In the Group.")
                }

                if (String(grp.owner) === String(isUser._id)) {
                    throw new Error("You are the owner, please transfer the ownership first.");
                }

                members.splice(members.indexOf(isUser._id), 1);
                let admins = grp.admins;

                if (admins.includes(isUser._id)) {
                    admins.splice(admins.indexOf(isUser._id), 1);
                }

                const updatedGrp = await groupModel.findByIdAndUpdate(grpid, { members: members, admins: admins });
                if (updatedGrp) {
                    let memeberGrps = isUser.memeberGrps;
                    memeberGrps.splice(memeberGrps.indexOf(grp._id), 1);
                    const user = await User.findByIdAndUpdate(isUser._id, { memeberGrps, assignmentsAssign:[] })
                    res.status(200).json({ success: true, details: `${req.body.email} deleted Successfully` });
                    return;
                }
            }
            throw new Error("Only admins can add or delete other members.")
        }
        // else if(query === "undefined"){}

    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() })
    }
}


const createNewGroup = async (req, res) => {
    try {
        const loggeduser = req.user;
        const user = await User.findOne({ email: loggeduser.email });
        if (!user) {
            throw new Error("User Not Found");
        }

        ReadAppend(file, `POST: ${BASE_URL}/group/createnewgrp called by user ${user.email} at ${Date.now()}\n`);

        const body = req.body;
        const grpCode = generateGrpCode();
        const admins = [user._id];
        const members = [user._id];
        const desc = (body.desc) ? body.desc : '';
        const ispublic = (body.public) ? body.public : false;
        const data = {
            name: "Grp_" + body.name,
            description: desc,
            joiningCode: grpCode,
            owner: user._id,
            createdDateAndTime: Date.now(),
            admins: admins,
            members: members,
            isPublic: ispublic
        }

        const create = await groupModel.create(data);
        if (create) {
            let memeberGrps = user.memeberGrps;
            memeberGrps.push(create._id);
            const updateUser = await User.findByIdAndUpdate(user._id, { memeberGrps: memeberGrps })
            res.status(200).json({ success: true, details: create });
            return;
        }

    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}

const deleteGroup = async (req, res) => {
    try {
        const grpId = req.query.grpid;
        const group = await groupModel.findById(grpId);
        if (!group) {
            throw new Error("Group Not Found");
        }

        const loggedUser = req.user;
        const user = await User.findOne({ email: loggedUser.email });

        if (!user) {
            throw new Error("User Not Found");
        }

        ReadAppend(file, `DELETE: ${BASE_URL}/group/deletegrp called by user ${user.email} at ${Date.now()}\n`);

        if (String(user._id) !== String(group.owner)) {
            throw new Error("You are not the owner of this group");
        }

        const deleteGroup = await groupModel.findByIdAndDelete(group._id);
        if (deleteGroup) {
            let memeberGrps = user.memeberGrps;
            for (let i = 0; i < memeberGrps.length; i++) {
                if (String(memeberGrps[i]) === String(group._id)) {
                    memeberGrps.splice(i, 1);
                    break;
                }
            }
            const updateUser = await User.findByIdAndUpdate(user._id, { memeberGrps: memeberGrps })
            res.status(200).json({ success: true, details: updateUser });
            return;
        }

    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}

const getJoiningCode = async (req, res) => {
    try {
        const loggeduser = req.user;
        const isUser = await User.findOne({ email: loggeduser.email });

        if (!isUser) {
            throw new Error("User not found");
        }

        ReadAppend(file, `GET: ${BASE_URL}/group/getcode called by user ${isUser.email} at ${Date.now()}\n`);

        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);
        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (!grp.admins.includes(isUser._id) && String(grp.owner) !== String(isUser._id)) {
            throw new Error("You are not an admin of this group");
        }

        const code = grp.joiningCode;
        res.status(200).json({ success: true, joiningCode: code });
    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}

const resetJoiningCode = async (req, res) => {
    try {
        const loggedUser = req.user;
        const isUser = await User.findOne({ email: loggedUser.email });
        if (!isUser) {
            throw new Error("User not found");
        }

        ReadAppend(file, `PATCH: ${BASE_URL}/group/resetcode called by user ${isUser.email} at ${Date.now()}\n`);

        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);
        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (!grp.admins.includes(isUser._id) && String(grp.owner) !== String(isUser._id)) {
            throw new Error("You are not an admin of this group");
        }

        const newCode = generateGrpCode();
        const updateGroup = await groupModel.findByIdAndUpdate(grp._id, { joiningCode: newCode });
        res.status(200).json({ success: true, details: "Group code reset." });

    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}


const setGrpType = async (req, res) => {
    try {
        const loggedUser = req.user;
        const isUser = await User.findOne({ email: loggedUser.email });
        if (!isUser) {
            throw new Error("User not found");
        }

        ReadAppend(file, `PATCH: ${BASE_URL}/group/setgrptype called by user ${isUser.email} at ${Date.now()}\n`);

        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);
        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (String(grp.owner) !== String(isUser._id)) {
            throw new Error("You are not the owner of this group");
        }
        const updatedGrp = await groupModel.findByIdAndUpdate(grp._id, { isPublic: !grp.isPublic });
        res.status(200).json({ success: true, isPublic: !grp.isPublic })
    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}

const getDetailsOfAGroup = async (req, res) => {
    try {
        const loggedUser = req.user;
        const isUser = await User.findOne({ email: loggedUser.email });
        if (!isUser) {
            throw new Error("User not found");
        }
        ReadAppend(file, `GET: ${BASE_URL}/group/getDetails called by user ${isUser.email} at ${Date.now()}\n`);
        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);

        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (!grp.admins.includes(isUser._id) && String(grp.owner) !== String(isUser._id) && !grp.members.includes(isUser._id)) {
            throw new Error("You are not a of this group");
        }

        const queries = req.body.queries;
        let details;
        if (!queries || queries.length === 0) {
            details = grp;
        }
        else {
            details = [];
            // console.log("queries[0] = ",(queries[0]))
            for (let i = 0; i < queries.length; i++) {
                let query = {};
                query[queries[i]] = grp[queries[i]];
                details.push(query);
            }
        }
        res.status(200).json({ success: true, details });
    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}


const transferOwnerShip = async (req, res) => {
    try {
        const loggedUser = req.user;
        const isUser = await User.findOne({ email: loggedUser.email });
        if (!isUser) {
            throw new Error("User not found");
        }

        ReadAppend(file, `PATCH: ${BASE_URL}/group/transferownership called by user ${isUser.email} at ${Date.now()}\n`);

        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);

        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (String(grp.owner) !== String(isUser._id)) {
            throw new Error("You are not the owner of this group");
        }

        const newOwnerEmail = req.body.email;
        const newUser = await User.findOne({ email: newOwnerEmail });

        if (!newUser) {
            throw new Error("Requested user is not exisited.");
        }

        if (String(newUser._id) === String(grp.owner)) {
            throw new Error("You cannot add yourself as owner.");
        }

        let members = grp.members;
        if (!members.includes(newUser._id)) {
            throw new Error("You can transfer ownership only to the members of the group.")
        }

        // members.push(newUser._id);

        let admins = grp.admins;
        if (!admins.includes(newUser._id)) {
            admins.push(newUser._id);
        }

        const updatedGroup = await groupModel.findByIdAndUpdate(grp._id, { owner: newUser._id, admins });
        res.status(200).json({ success: true, details: `ownership transferred to ${newOwnerEmail}` });
        return;
    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}

const joinGrpByCode = async (req, res) => {
    try {
        const loggedUser = req.user;
        const user = await User.findOne({ email: loggedUser.email });

        if (!user) {
            throw new Error("User not found");
        }

        ReadAppend(file, `PATCH: ${BASE_URL}/group/joinbycode called by user $
        {user.email} at ${Date.now()}\n`);

        const grpCode = req.body.grp_code;
        const grp = await groupModel.findOne({ joiningCode: grpCode });

        if (!grp) {
            throw new Error("Grp Doesn't Exist Or Code Expired");
        }

        if (grp.members.includes(user._id) || grp.admins.includes(user._id) || String(grp.owner) === String(user._id)) {
            throw new Error("Already a member.")
        }

        let members = grp.members;
        members.push(user._id);

        let memeberGrps = user.memeberGrps;
        memeberGrps.push(grp._id);

        // const mem_id = user._id;

        let assignmentsPosted = grp.assignmentsPosted;
        
        let assignmentsAssign = user.assignmentsAssign;

        for(let i = 0;i<assignmentsPosted.length;i++){
            assignmentsAssign.push(assignmentsPosted[i]);
        }

        
        

        const addedUser = await groupModel.findByIdAndUpdate(grp._id, { members });

        const addedGrp = await User.findByIdAndUpdate(user._id, { memeberGrps, assignmentsAssign });

        res.status(200).json({ success: true, details: `Successfully added to the Grp.` })
        return;

    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}


const getAllMembers = async (req, res) => {
    try {
        const loggedUser = req.user;

        const isUser = await User.findOne({ email: loggedUser.email });
        if (!isUser) {
            throw new Error("User not found");
        }

        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);

        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (!grp.admins.includes(isUser._id) && String(grp.owner) !== String(isUser._id) && !grp.members.includes(isUser._id)) {
            throw new Error("You are not a member of this group");
        }

        const owner = await User.findById(grp.owner).select("firstName lastName email");;
        let admins = await getAllMembersFromArray(grp.admins);
        let members = await getAllMembersFromArray(grp.members);
        let newAdmins = [];
        for (let i = 0; i < admins.length; i++) {
            if (admins[i].email !== owner.email) {
                newAdmins.push(admins[i]);
            }
        }
        let newMember = [];
        for (let i = 0; i < members.length; i++) {
            if (!grp.admins.includes(members[i]._id)) {
                newMember.push(members[i]);
            }
        }

        res.status(200).json({
            success: true, details: {
                admins: newAdmins,
                members: newMember,
                owner
            }
        });

    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}


const getAllItemsOfAGrp = async (req, res) => {
    try {
        const loggedUser = req.user;

        const isUser = await User.findOne({ email: loggedUser.email });
        if (!isUser) {
            throw new Error("User not found");
        }

        const grpid = req.body.group_id;
        const grp = await groupModel.findById(grpid);

        if (!grp) {
            throw new Error("Group doesn't exist");
        }

        if (!grp.admins.includes(isUser._id) && String(grp.owner) !== String(isUser._id) && !grp.members.includes(isUser._id)) {
            throw new Error("You are not a member of this group");
        }

        const grpItems = grp.itemsPosted;

        const allItems = await getItemFromArray(grpItems);
        // console.log(allItems);
        res.status(200).json({ success: true, details: allItems })

    } catch (err) {
        res.status(400).json({ "success": false, error: err.toString() });
    }
}


const getAllAssignmentsForAGroup = async (req, res) => {
    try {
        const grpDetails = req.body.groupDetails;
        let getGrpAssignments = await getAssignmentArray(grpDetails.assignmentsPosted);

        getGrpAssignments.sort(function (a, b) {
            return (a.dueDateTime < b.dueDateTime) ? -1 : ((a.dueDateTime > b.dueDateTime) ? 1 : 0);
        });

        res.status(200).json({ success: true, details: getGrpAssignments })
        return;
    } catch (err) {
        res.status(400).json({ success: false, error: err.toString() });
    }
}
//ll


export { createNewGroup, deleteGroup, getAllGroups, getUserGroups, addAdmins, addUserToGroup, getJoiningCode, resetJoiningCode, setGrpType, getDetailsOfAGroup, transferOwnerShip, joinGrpByCode, getAllMembers, getAllItemsOfAGrp, getAllAssignmentsForAGroup };