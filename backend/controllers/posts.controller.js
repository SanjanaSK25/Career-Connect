import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";

import bcrypt from "bcrypt";

export const activeCheck = async (req, res) => {
    return await res.status(200).json({message: "Running"});
}


// Create Post Controller
export const createPost = async (req, res) => {

    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token });

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const post = new Post({
            userId: user._id,
            body: req.body.body,
            media: req.file != undefined ? req.file.filename : "",
            fileType: req.file != undefined ? req.file.mimetype.split("/")[1] : "", //mp3, mp4, gif
        });

        await post.save();

        return res.status(200).json({message: "Post created successfully"});

    } catch (error) {
        return res.status(500).json({message: error.message});
    }
}


// Get All Posts Controller
export const getAllPosts = async (req, res) => {
    try {

        const posts = await Post.find().populate('userId', 'name username email profilePicture');
        return res.json({posts});

    } catch (error) {
        return res.status(500).json({message: error.message});
    }
}


// Delete Post Controller
export const deletePost = async (req, res) => {

    const { token, post_id } = req.body;

    try { 

        const user = await User.findOne({ token: token }).select("_id");

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const post = await Post.findOne({ _id: post_id });

        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }

        if(post.userId.toString() !== user._id.toString()) {
            return res.status(401).json({message: "Unauthorized"});
        }

        await Post.deleteOne({ _id: post_id });

        return res.status(200).json({message: "Post deleted successfully"});

    } catch (error) {
        return res.status(500).json({message: error.message});
    }
}


// Comment on Post Controller
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


// Get comments by Post Controller
export const get_comments_by_post = async (req, res) => {

    const {post_id} = req.query;
    
    try {
        const post = await Post.findOne({ _id: post_id });

        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }

        const comments = await Comment.find({ postId: post_id }).populate("userId", "username name");

        return res.json(comments.reverse());
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


// Delete comment of user Controller
export const delete_comment_of_user = async (req, res) => {

    const { token, comment_id } = req.body;

    try {

        const user = await User.findOne({ token: token }).select("_id");

        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const comment = await comment.findOne({ _id: comment_id });

        if(!comment) {
            return res.status(404).json({message: "Comment not found"});
        }

        if(comment.userId.toString() !== user._id.toString()) {
            return res.status(401).json({message: "Unauthorized"});
        }

        await comment.deleteOne({ "_id": comment_id });

        return res.status(200).json({ message: "Comment deleted" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


// Increment Likes Controller
export const increment_likes = async (req, res) => {

    const { post_id } = req.body;

    try {

        const post = await Post.findOne({ _id: post_id });

        if(!post) {
            return res.status(404).json({message: "Post not found"});
        }

        post.likes += 1;

        await post.save();
        
        return res.status(200).json({ message: "Like incremented" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}