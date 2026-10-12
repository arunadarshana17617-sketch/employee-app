import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

// PUT /api/employees/:id
// Updates an existing employee
export async function PUT(request, { params }) {
  try {
    // Make sure the id looks like a valid MongoDB id
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const body = await request.json();

    // Check that all required fields were sent
    const required = ["firstName", "lastName", "address", "email", "gender", "dob", "age"];
    const missing = required.filter((f) => body[f] === undefined || body[f] === "");
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Date of birth cannot be in the future
    if (new Date(body.dob) > new Date()) {
      return NextResponse.json({ error: "Date of birth cannot be in the future." }, { status: 400 });
    }

    await connectDB();
    const updated = await Employee.findByIdAndUpdate(
      params.id,
      {
        firstName: body.firstName,
        secondName: body.secondName || "",
        middleName: body.middleName || "",
        lastName: body.lastName,
        address: body.address,
        email: body.email.trim().toLowerCase(),
        gender: body.gender,
        dob: body.dob,
        age: Number(body.age),
      },
      {
        new: true, // return the updated document
        runValidators: true, // apply the schema rules on update too
      }
    );

    if (!updated) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);

    // Duplicate email (another employee already uses it)
    if (err.code === 11000) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update the employee." }, { status: 500 });
  }
}

// DELETE /api/employees/:id
// Deletes an employee
export async function DELETE(_request, { params }) {
  try {
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    await connectDB();
    const deleted = await Employee.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not delete the employee." }, { status: 500 });
  }
}