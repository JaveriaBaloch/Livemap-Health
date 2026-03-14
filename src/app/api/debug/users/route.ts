import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get all users (limited to first 20 for safety)
    const users = await User.find({})
      .select('email phone name isVerified role')
      .limit(20)
      .lean();

    // Check for duplicates
    const emailCounts: Record<string, number> = {};
    const phoneCounts: Record<string, number> = {};
    
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
      phoneCounts[user.phone] = (phoneCounts[user.phone] || 0) + 1;
    });

    const duplicateEmails = Object.entries(emailCounts)
      .filter(([_, count]) => count > 1)
      .map(([email, count]) => ({ email, count }));

    const duplicatePhones = Object.entries(phoneCounts)
      .filter(([_, count]) => count > 1)
      .map(([phone, count]) => ({ phone, count }));

    return NextResponse.json({
      totalUsers: users.length,
      users: users,
      duplicates: {
        emails: duplicateEmails,
        phones: duplicatePhones
      }
    });
  } catch (error: any) {
    console.error("Debug users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE endpoint to clean up duplicates (use with caution)
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    
    if (action === "cleanup-duplicates") {
      // Find users grouped by email
      const duplicateUsers = await User.aggregate([
        { $group: { 
            _id: "$email", 
            users: { $push: "$$ROOT" }, 
            count: { $sum: 1 } 
        }},
        { $match: { count: { $gt: 1 } } }
      ]);

      let removedCount = 0;
      
      for (const group of duplicateUsers) {
        // Keep the first user (usually the oldest), remove the rest
        const usersToRemove = group.users.slice(1);
        
        for (const user of usersToRemove) {
          await User.findByIdAndDelete(user._id);
          removedCount++;
        }
      }
      
      return NextResponse.json({ 
        message: `Removed ${removedCount} duplicate users`,
        removedCount 
      });
    }
    
    if (action === "reset-all") {
      // WARNING: This will delete ALL users
      const result = await User.deleteMany({});
      return NextResponse.json({ 
        message: `Deleted ${result.deletedCount} users`,
        deletedCount: result.deletedCount 
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}