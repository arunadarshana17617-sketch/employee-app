import mongoose from "mongoose";

// Defines what an employee document looks like in MongoDB
const EmployeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    // Second name is optional
    secondName: { type: String, trim: true, default: "" },
    // Middle name is optional too
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // the same email cannot be saved twice
      match: [/^\S+@\S+\.\S+$/, "Email format is invalid"],
    },
    gender: { type: String, required: true, enum: ["male", "female"] },
    dob: { type: Date, required: true },
    age: { type: Number, required: true, min: 1, max: 120 },
  },
  // Adds createdAt and updatedAt fields automatically
  { timestamps: true }
);

// Reuse the model if it already exists (prevents errors on hot reload)
export default mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);