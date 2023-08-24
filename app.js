import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/AuthRoute.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express"
import methodOverride from "method-override";
import morgan from "morgan";
import { grpRouter } from "./routes/GrpRoutes.js";
import path from "path";
import { grpItemRoutes } from "./routes/GrpItemRoutes.js";
import { grpAssignmentRoutes } from "./routes/AssignmentRoutes.js";
// import ChattingRouter from "./routes/ChattingRoutes.js";
import userRouter from "./routes/userRoute.js";
import notesRoutes from "./routes/notesRoutes.js";




const BASE_URL = process.env.BASE_URL;
const app = express();

app.use(express.json());
app.use(methodOverride())
app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));

// enable CORSn
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
        "Access-Control-Allow-Methods",
        "GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, security-key, auth-token,"
    );
    next();
});

app.use((req, res, next) => {

    if (req.originalMethod !== "GET" && req.headers["security-key"] !== process.env.SECURITY_KEY) {
        res.json({"message": "You are not authorized"});
        return;
    }
    next();
});

app.use(BASE_URL, authRouter);
app.use(BASE_URL, grpRouter);
app.use(BASE_URL,grpItemRoutes)
app.use(BASE_URL,grpAssignmentRoutes)
app.use(BASE_URL,userRouter)
app.use(BASE_URL,notesRoutes)


const swaggerDefinition = {
    info: {
        title: "Teams Admin",
        version: "1.0.0",
        description: "Node apps for the admin panel of Teams application",
    },
    host: "localhost:5000",
    basePath: "/",
};

const options = {
    // import swaggerDefinitions
    swaggerDefinition,
    // path to the app docs
    apis: ["./Controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const runApp = () => {

    mongoose.set('strictQuery', false);

    const url = "mongodb://0.0.0.0:27017/clone";
    // const url = "mongodb+srv://Admin-Jay:"+process.env.mongopass+"@cluster0.4v9bd.mongodb.net/clone?retryWrites=true&w=majority"

    mongoose.connect(url, (err, res) => {
        //console.log(err, res);
        if(err){
            // res.json({err:err.toString()})
            console.log({err:err.toString()})
        }
        console.log("connected to mongodb");
    });
    
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`App Listening To Port ${PORT}`)
    })
}

runApp();
