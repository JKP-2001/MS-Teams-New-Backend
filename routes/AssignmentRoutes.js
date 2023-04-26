import checkAdmin from "../middlewares/checkAdmin.js";
import express from "express";
const grpAssignmentRoutes = express.Router();
import { fetchUser } from "../middlewares/fetchUser.js";

import multer from "multer";

import { createNewAssignment, getAParticularAssignment } from "../controllers/AssignmentContoller.js";
import checkGrpMember from "../middlewares/checkGrpMember.js";

const file_storage = multer.diskStorage({        // function for a image storage
    destination: function (req, file, cb) {     // setting destination
        cb(null, "./uploads/assignments")
    },
    filename: function (req, file, cb) {        // setting specification of file
        cb(null, Date.now() + "-" + file.originalname);

    }
})

const upload = 
    multer({    //function to upload image in the destination
    storage: file_storage, limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype.split("/")[1] === "pdf") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg .jpeg .pdf format allowed!'));
        }
    }
})


// app.post("/upload_files", fetchuploadFiles);

grpAssignmentRoutes.post("/grp/newassignment",upload.array("assignments"),fetchUser,checkAdmin,createNewAssignment);

grpAssignmentRoutes.post("/grp/assignment/:id",fetchUser,checkGrpMember,getAParticularAssignment)

export {grpAssignmentRoutes}









































// import { fetchUser } from "../middlewares/fetchUser.js";

// import express from "express";
// import { groupModel } from "../Models/Group.js";
// import { User } from "../models/User.js";
// import {Assignment} from '../models/Assignment.js'
// import { createAssignment, deleteAssignment, getAssignment, turnInAssignment, uppdateAssignment } from "../controllers/AssController.js";
// const assRouter = express.Router();



// // Create Assignment

// assRouter.post("/assignment/:id", fetchUser, createAssignment);

// // Get Assinment By Id
// assRouter.get("/assignment/:id", fetchUser, getAssignment);

// // Get All Assignments ---> some changes are required
// assRouter.get("/allAssignment/:id", fetchUser, );

// // Update Assignment
// assRouter.put("/assignment/:id", fetchUser,uppdateAssignment );

// // Delete Assignment
// assRouter.delete("/assignment/:id", fetchUser,deleteAssignment);

// // Turn in Assignment
// assRouter.post("/assignment/turnin/:id", fetchUser,turnInAssignment);


// export {assRouter}
