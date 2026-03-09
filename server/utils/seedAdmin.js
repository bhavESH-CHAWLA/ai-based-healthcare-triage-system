const User = require("../models/User");
const bcrypt = require("bcrypt");

const seedAdminUser = async () => {
  try {
    const adminEmail = "bhaveshchawla2006@gmail.com";
    
    // Delete any existing user with this email (cleanup old patient account if exists)
    const deletedUser = await User.findOneAndDelete({ email: adminEmail });
    if (deletedUser) {
      console.log(`✓ Deleted existing account: ${adminEmail} (was ${deletedUser.role})`);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("Ssvb@4", 10);

    const admin = await User.create({
      name: "bhavesh chawla",
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });

    console.log(`✓ Admin user created successfully: ${admin.email}`);
  } catch (error) {
    console.error("Error seeding admin user:", error.message);
  }
};

module.exports = seedAdminUser;
