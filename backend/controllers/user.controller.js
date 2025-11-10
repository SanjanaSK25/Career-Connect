import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import connectionRequest from "../models/connections.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import fs from "fs";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";



//resume download helper
const convertUserDataToPDF = async (userData) => {
    const doc = new PDFDocument();

    const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
    const stream = fs.createWriteStream("uploads/" + outputPath);

    doc.pipe(stream);

    doc.image(`uploads/${userData.userId.profilePicture}`, { align: "center", width: 100 });
    doc.fontSize(14).text(`Name: ${userData.userId.name}`);
    doc.fontSize(14).text(`Username: ${userData.userId.username}`);
    doc.fontSize(14).text(`Email: ${userData.userId.email}`);
    doc.fontSize(14).text(`Bio: ${userData.bio}`);
    doc.fontSize(14).text(`Current Position: ${userData.currentPost}`);

    doc.fontSize(14).text(`Past Work:`)
    userData.pastWork.forEach((work, index) => {
        doc.fontSize(14).text(`Company Name: ${work.company}`);
        doc.fontSize(14).text(`Position: ${work.position}`);
        doc.fontSize(14).text(`Years: ${work.years}`);
    });

    doc.end();

    return outputPath;
}

//register controller
export const register = async (req, res) => {
    console.log(req.body);
    try {
        const { name, email, password, username } = req.body;

        if(!name || !email || !password || !username) return res.status(400).json({ message: "All fields are required" });

        const user = await User.findOne({email});

        if(user) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, username });

        await newUser.save();

        const newProfile = new Profile({ userId: newUser._id });
        await newProfile.save();

        return res.json({ message: "User created" });

    } catch (error) {
        console.error('Register error:', error); 
        return res.status(500).json({ message: "Something went wrong" });
    }   
}

//login controller 
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) return res.status(400).json({ message: "All fields are required" });

        const user = await User.findOne({email});

        if(!user) return res.status(404).json({ message: "User does not exist" });

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = crypto.randomBytes(32).toString("hex"); //why 32 bytes? because its more secure than 16 bytes

        await User.updateOne({ _id: user._id }, { token });

        return res.json({ token: token });

    } catch (error) {
        console.error('Login error:', error); 
        return res.status(500).json({ message: "Something went wrong" });
    }   
}


//upload profile picture controller
export const uploadProfilePicture = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profilePicture = req.file.filename;
        await user.save();
        
        return res.status(200).json({ message: "Profile picture updated successfully"});
        
    } catch(error) {
        return res.status(500).json({ message: error.message });
    }
}


// Update user profile controller
export const updateUserProfile = async (req, res) => {

    try {
        const {token, ...newUserData} = req.body;

        const user = await User.findOne({ token: token });

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const {username, email} = newUserData; //destructure newUserData to get the fields to be updated

        const existingUser = await User.findOne({$or: [{username}, {email}] }); //check if username or email already exists for other users

        if(existingUser) {
            if(existingUser || String(existingUser._id) !== String(user._id)) {

                return res.status(400).json({message: "User already exists"});
            }
        }

        Object.assign(user, newUserData); //update user with new data
        
        await user.save();

        return res.status(200).json({message: "User Updated"});

    } catch(error) {
        return res.status(500).json({ message: error.message });
    }

}


// Get user and profile controller
export const getUserAndProfile = async (req, res) => {
    try {
        const { token } = req.query;

        console.log(`Token: ${token}`);
        
        const user = await User.findOne({ token: token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(user);

        const userProfile = await Profile.findOne({ userId: user._id })
            .populate('userId', 'name email username profilePicture'); //exclude password and token from user data

        return res.json(userProfile);

    } catch(error) {
        return res.status(500).json({ message: error.message });
    }
}       


// Post controller to update profile data
export const updateProfileData = async (req, res) => {
    try {

        const { token, ...newProfileData } = req.body;

        const userProfile = await User.findOne({ token: token });

        if(!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        const profile_to_update = await Profile.findOne({ userId: userProfile._id });

        Object.assign(profile_to_update, newProfileData);

        await profile_to_update.save();
        
        return res.status(200).json({ message: "Profile Updated" });

    } catch(error) {
        return res.status(500).json({message: error.message});
    }
}


// Get controller to fetch user profile data 
export const getAllUserProfile = async (req, res) => {
    try {
        const profiles = await Profile.find().populate('userId', 'name username email profilePicture'); 

        return res.json({ profiles });

    } catch(error) {
        return res.status(500).json({ message: error.message });
    }
}


// Download resume controller
export const downloadProfile = async (req, res) => {

    const user_id = req.query.id;

    const userProfile = await Profile.findOne({userId: user_id}).populate('userId', 'name username email profilePicture');

    let outputPath = await convertUserDataToPDF(userProfile);

    return res.json({ "message": outputPath});
}


// Send connection request controller
export const sendConnectionRequest = async (req, res) => {

    const { token, connectionId } = req.body;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connectionUser = await User.findOne({ _id: connectionId });

        if(!connectionUser) {
            return res.status(404).json({ message: "Connection user not found" });
        }

        const exisitingRequest = await connectionRequest.findOne({ userId: user._id, connectionId: connectionUser._id });

        if(exisitingRequest) {
            return res.status(400).json({ message: "Request already sent" });
        }

        const request = new connectionRequest({
            userId: user._id, connectionId: connectionUser._id
        });

        await request.save();

        return res.json({ message: "Request Sent"});

    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
}


// Get my connections request
export const getMyConnectionsRequets = async (req, res) => {

    const {token} = req.query;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connections = await connectionRequest.find({ userId: user._id }).populate('connectionId', 'name username email profilePicture');

        return res.json({ connections});

    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
}


// what are my connections
export const whatAreMyConnections = async (req, res) => {

    const {token} = req.query;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connections = await connectionRequest.find({ connectionId: user._id }).populate('userId', 'name username email profilePicture');

        return res.json( connections );
    } catch(err) {

        return res.status(500).json({ message: err.message });

    }
}


// Accept or reject connection request
export const acceptConnectionRequest = async (req, res) => {
    const { token, requestId, action_type } = req.body;
    
    try {
        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connection = await connectionRequest.findOne({ _id: requestId });

        if(!connection) {       
            return res.status(404).json({ message: "Connection not found" });
        }

        if(action_type === "accept") { 
            connection.status_accepted = true;
        } else {
            connection.status_accepted = false;
        }

        await connection.save();

        return res.json({ message: "Request updated" });

    } catch(err) {
        return res.status(500).json({ message: err.message });
    }
} 


//Comment on Post
export const commentPost = async (req, res) => {

    const { token, post_id, commentBody } = req.body;

    try {

        const user = await User.findOne({ token: token }).select("_id");

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const post = await Post.findOne({ _id: post_id }); 

        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }

        const comment = new Comment({
            userId: user._id,
            postId: post._id,
            body: commentBody  
        });

        await comment.save();

        return res.status(200).json({ message: "Comment added" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// Get user profile and user based on username
export const getUserProfileAndUserBasedOnUsername = async (req, res) => {

    const { username } = req.query;

    try {

        const user = await User.findOne({
            username
        });

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const userProfile = await Profile.findOne({ userId: user._id }).populate('userId', 'name username email profilePicture');

        return res.json({ "profile": userProfile })

    } catch(error) {
        return res.status(500).json({ message: error.message });
    }
}