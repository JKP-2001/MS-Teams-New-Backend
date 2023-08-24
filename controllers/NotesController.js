// import {notes as Notes} from "../models/Notes.js"
import {Notes} from "../models/Notes.js"
import { user as User } from "../models/User.js";


const createNotes = async (req, res) => {
    try{
        const loguser = req.user;
        
        const isUser = await User.findOne({ email: loguser.email });

        if (!isUser) {
            throw new Error("User not found");
        }

        const user = isUser._id;


        const {title, content} = req.body;

        const groupPostId = req.body.groupPostId;


        const notes = groupPostId?await Notes.create({title, content, user, groupPostId}):await Notes.create({title, content, user});

        await User.findByIdAndUpdate(user, {$push: {notes: notes._id}});

        res.status(200).json({success:true, notes});
    }catch(error){
        res.status(400).json({success:false,message: error.toString()})
    }
}

const getNotes = async (req, res) => {
    try{
        const loggedUser = req.user;

        const user = await User.findOne({email: loggedUser.email});


        if(!user){
            throw new Error("User not found");
        }

        if(!user.notes.includes(req.body.noteId)){
            throw new Error("You are not authorized to view this notes");
        }

        const notes = await Notes.findById(req.body.noteId);
        res.status(200).json({success:true, notes});

    }catch(error){
        res.status(400).json({success:false,message: error.toString()})
    }
}

const updateNotes = async (req, res) => {
    try{
        
        const loggedUser = req.user;

        const isUser = await User.findOne({ email: loggedUser.email });

        if (!isUser) {
            throw new Error("User not found");
        }

        const notes = await Notes.findOne({ _id: req.params.id });

        if (!notes) {
            throw new Error("Notes not found");
        }

        if (notes.user.toString() !== isUser._id.toString()) {
            throw new Error("You are not authorized to update this notes");
        }

        const {title, content} = req.body;

        await Notes.findByIdAndUpdate(req.params.id, {title, content, updatedAt: Date.now()});

        res.status(200).json({success:true, notes});

    }catch(error){
        res.status(400).json({success:false,message: error.toString()})
    }
}

const deleteNotes = async (req, res) => {

    try{
        const loggedUser = req.user;

        const isUser = await User.findOne({ email: loggedUser.email });

        if (!isUser) {
            throw new Error("User not found");
        }

        const notes = await Notes.findOne({ _id: req.body.id });

        if (!notes) {
            throw new Error("Notes not found");
        }

        if (notes.user.toString() !== isUser._id.toString()) {
            throw new Error("You are not authorized to delete this notes");
        }

        await Notes.findByIdAndDelete(req.body.id);

        await User.findByIdAndUpdate(isUser._id, {$pull: {notes: req.body.id}});

        res.status(200).json({success:true, notes});

    }catch(error){
        res.status(400).json({success:false,message: error.toString()})
    }
}

const getNotesOfAuser = async (req, res) => {
    try{
        const loggedUser = req.user;

        const isuser = await User.findOne({ email: loggedUser.email });

        if (!isuser) {
            throw new Error("User not found");

        }

        const notesIds = isuser.notes;

        // console.log({notesIds})

        const notes = await Notes.find({ _id: { $in: notesIds } }).sort({ updatedAt: -1 });

        res.status(200).json({success:true, notes});

    }catch(error){
        res.status(400).json({success:false,message: error.toString()})
    }
}

export {createNotes, getNotes, updateNotes, deleteNotes, getNotesOfAuser}
