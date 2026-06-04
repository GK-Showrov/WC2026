import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If this email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.deleteMany({ where: { email: email.toLowerCase() } });
    await prisma.passwordResetToken.create({
      data: { email: email.toLowerCase(), token, expires },
    });

    // In production, send email here via nodemailer
    // For now, log the reset URL
    console.log(`Password reset URL: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`);

    return NextResponse.json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
