import jwt from "jsonwebtoken";

//in the next it will execute the controller fn
//whenever it hits endpoint this middleware is executed
const userAuth = async (req, res, next) => {
    const {token} = req.cookies;

    if (!token){
        return res.json({success: false, message: 'Not Authorized. Login Again'});
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.id){
            if (!req.body) req.body = {};
            req.body.userId = tokenDecode.id;
        }else{
            return res.json({success: false, message: 'Not Authorized. Login Again'});
        }

        next(); 
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export default userAuth;