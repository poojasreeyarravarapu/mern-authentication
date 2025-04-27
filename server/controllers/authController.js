import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register = async (req, res) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password){
        return res.json({success: false, message: 'Missing details'});
    }

    try {

        const existingUser = await userModel.findOne({email})
        //if any user is already there then it returns true
        if(existingUser){
            return res.json({success: false, message: 'User already exists'})
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({name, email, password: hashedPassword});
        // save this user in the database
        await user.save();
        //we have to generate one token for authentication and we send it to cookies
        
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: '7d'});
        //after generating this token we have to send this token to users in response and
        //  in the response we will add the cookie. using the cookie we will send this token
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', //development that is http it is false
            sameSite: 'none', // in devolepment environment it is strict
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })//name and value are provided

        //before response send a welcome email

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to App',
            text: `Welcome to app website. Your account has been created with email id: ${email}`
        }
        await transporter.sendMail(mailOptions);
 
        return res.json({success: true});

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const login = async (req,res) => {
    const {email,password} = req.body;

    if (!email || !password){
        return res.json({success:false, message: 'Email and password are required'})
    }

    try {
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success:false, message: 'Invalid email'})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch){
            return res.json({success: false, message: 'Invalid Password'})
        }

        //now pass matcching and user is there 
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: '7d'});
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', //development that is http it is false
            sameSite: process.env.NODE_ENV === 'none', // in devolepment environment it is strict
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({success: true});

    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

export const logout = async(req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', //development that is http it is false
            sameSite: process.env.NODE_ENV === 'none', // in devolepment environment it is strict
        })

        return res.json({success: true, message: 'Logged Out'})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

//email verification control and verify their account
export const sendVerifyOtp = async (req,res) => {
    try {
        const {userId} = req.body;
        const user = await userModel.findById(userId);
        if(user.isAccountVerified){
            return res.json({success: false, message: "Account already verified"})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now()+ 24 * 60 * 60 * 1000//1day

        await user.save();

        //otp to user

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account verification OTP ',
            //text: `Your otp is ${otp}. Verify your account using this OTP`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }
        await transporter.sendMail(mailOption);

        res.json({success:true, message: 'Verification OTP sent on email'})

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

//for account verified using otp
export const verifyEmail = async (req,res) => {
    const {userId, otp} = req.body;

    if (!userId || !otp) {
        return res.json({success: false, message: 'Missing details'});
    }
    try {
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false, message: 'User not found'});
        }

        if (user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP'});
        }

        if (user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: 'OTP Expired'});
        }

        user.isAccountVerified = true;

        user.verifyOtp = '';
        user.verifyOtpExpireAt=0;

        await user.save();

        return res.json({success: true, message: 'Email verified successfully'});
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// check if user is authenticated
export const isAuthenticated = async (req,res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

//Send password reset otp
export const sendResetOtp = async (req, res) => {
    const {email} = req.body;

    if (!email) {
        return res.json({success: false, message: "Email is required"});
    }

    try {
        const user = await userModel.findOne({email});
        if (!user){
            return res.json({success: false, message: "User not found"});
        }
        // if user is available with this email. we will send a otp generated to the email

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now()+ 15 * 60 * 1000//15 min

        await user.save();

        //otp to user email

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password reset OTP',
            //text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password.`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };
        await transporter.sendMail(mailOption);

        res.json({success:true, message: 'Reset OTP sent to your email'})
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

//user can verify otp and reset password
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({success: false, message: "Email, OTP, and new password are required"});
    }

    try {
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: 'User not found'});
        }

        if (user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP'});
        }

        //check for expiry
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: 'OTP expired'});
        }

        const  hashedPassword = await bcrypt.hash(newPassword, 10);
        //update the pass in users database

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({success: true, message: 'Password has been reset successfully.'});
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}
