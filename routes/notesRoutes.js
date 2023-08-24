import express from "express";
const notesRoutes = express.Router();


import { fetchUser } from "../middlewares/fetchUser.js";

import { createNotes, deleteNotes, getNotesOfAuser, getNotes, updateNotes } from "../controllers/NotesController.js";


notesRoutes.post("/notes/create", fetchUser, createNotes);
notesRoutes.get("/notes/fetchall", fetchUser, getNotesOfAuser);
notesRoutes.post("/notes/fetch", fetchUser, getNotes);
notesRoutes.patch("/notes/update/:id", fetchUser, updateNotes);
notesRoutes.delete("/notes/delete", fetchUser, deleteNotes);




export default notesRoutes;

