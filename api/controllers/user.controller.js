import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import Listing from '../models/listing.model.js';

export const test = (req, res) => {
  res.json({
    message: 'Api route is working!',
  });
};

export const updateUser = async (req, res, next) => {
  //verify the user
  if (req.user.id !== req.params.id)                                                //unautorized access
    return next(errorHandler(401, 'You can only update your own account!'));              
  try {
    //if password updation is requested by user then hash the new password 
    if (req.body.password) {
      const salt = bcryptjs.genSaltSync(10);
      req.body.password = bcryptjs.hashSync(req.body.password, salt);
    }

    //find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }                                            // to get the updated user
    );

    const { password, ...rest } = updatedUser._doc;            //extact user info

    res.status(200).json(rest);                               //send the updated user info 
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only delete your own account!'));
  try {
    //find and delete the user
    await User.findByIdAndDelete(req.params.id);
    //clear the jwt token
    res.clearCookie('access_token');
    res.status(200).json('User deleted Sucessfully!');
  } catch (error) {
    next(error);
  }
};

//to get all the listings of the user
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });                  //find the users listing by their id
      res.status(200).json(listings);                                                   //send all the listings in response
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }
};

//to get info of other user (landlord)
export const getUser = async (req, res, next) => {
  try {
    
    const user = await User.findById(req.params.id);                                       //get the user from db from their id(id is present in the request api route)
  
    if (!user) return next(errorHandler(404, 'User not found!'));
  
    const { password: pass, ...rest } = user._doc;
  
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
