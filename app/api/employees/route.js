import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

// Never cache this route, always read fresh data
export const dynamic = "force-dynamic";

// GET /api/employees
// Returns all employees, newest first
export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(employees);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load employees." }, { status: 500 });
  }
}

// POST /api/employees
// Saves a new employee
export async function POST(request) {
  try {
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
    const employee = await Employee.create({
      firstName: body.firstName,
      secondName: body.secondName,
      lastName: body.lastName,
      address: body.address,
      email: body.email,
      gender: body.gender,
      dob: body.dob,
      age: Number(body.age),
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error(err);

    // 11000 = duplicate key (the email already exists)
    if (err.code === 11000) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }
    // Schema validation errors (wrong gender, age out of range, etc.)
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save the employee." }, { status: 500 });
  }
}