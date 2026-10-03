import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: [true, "Clerk ID is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxLength: [100, "Full name cannot exceed 100 characters"],
    },
    profilePic: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "production",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Model Static Method: Retrieve sidebar users excluding the logged-in user
 */
userSchema.statics.getSidebarUsers = function (excludeUserId) {
  return this.find({ _id: { $ne: excludeUserId } }).select("-clerkId");
};

const User = mongoose.model("User", userSchema);

export default User;
