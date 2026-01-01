import User from "../models/User.js"
import { createClerkClient } from "@clerk/backend"

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const registerUser = async(req,res) => {
    try {
        console.log("REGISTER USER CALLED")
        console.log(req.body)
        
        const clerkUserId = req.userId

        const{name, email, collegeName, phoneNumber, year, gender} = req.body

        if(!name || !email || !collegeName) 
            return res.status(400).json({message: "Please fill in all required fields"})

        const existingUser = await User.findOne({clerkUserId})

        if(existingUser)
            return res.status(400).json({message: "User already exists"})

        const user = await User.create({
        clerkUserId,
        name,
        email,
        collegeName,
        phoneNumber,
        year,
        gender,
        })

        // Update Clerk publicMetadata to mark user as registered
        try {
            await clerkClient.users.updateUser(clerkUserId, {
                publicMetadata: {
                    isRegistered: true,
                },
            });
            console.log("Clerk publicMetadata updated successfully");
        } catch (clerkError) {
            console.error("Failed to update Clerk metadata:", clerkError);
            // Continue anyway since database registration succeeded
        }

        return res.status(201).json({message: "User registered successfully",user,});

        
    } catch (error) {
    console.error("REGISTER USER ERROR", error);
    return res.status(500).json({message: "Internal server error" })

    }
}

