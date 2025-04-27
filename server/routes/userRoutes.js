import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData } from '../controllers/userController.js';

const userRouter = express.Router();

//with this router we create end points

userRouter.get('/data', userAuth, getUserData);

export default userRouter;
//now we have export this into server.js file
