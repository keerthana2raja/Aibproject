const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      default: null,
      sparse: true, // allows multiple nulls in unique index
      uppercase: true,
      trim: true,
      match: [/^EMP-\d{3,6}$/, "employeeId format must be EMP-001"],
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@infovision\.com$/,
        "Only @infovision.com email addresses are allowed",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["admin", "governance", "engineering", "viewer"],
        message: "Role must be one of: admin, governance, engineering, viewer",
      },
      default: "viewer",
    },

    initials: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Auto-generate initials before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    this.initials = this.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
