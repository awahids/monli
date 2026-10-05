import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  let body: z.infer<typeof signUpSchema>;
  try {
    body = signUpSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "Data pendaftaran tidak valid",
      },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const admin = createAdminClient();

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { name: body.name } },
  });

  if (error) {
    let message = "Registration failed";

    if (
      error.message.includes("already registered") ||
      error.message.includes("already exists")
    ) {
      message = "Email ini sudah terdaftar. Silakan masuk.";
    } else if (error.message.includes("weak_password")) {
      message = "Kata sandi terlalu lemah. Pilih yang lebih kuat.";
    } else if (error.message.includes("invalid_credentials")) {
      message = "Format email atau kata sandi tidak valid.";
    } else {
      message = error.message;
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 },
    );
  }

  const userId = data.user?.id;
  if (userId) {
    const profile = await admin.from("profiles").insert({
      id: userId,
      email: body.email,
      name: body.name,
      default_currency: "IDR",
    });

    if (!profile) {
      console.error("Profile creation error");
      return NextResponse.json(
        {
          ok: false,
          error: "Gagal membuat profil. Coba lagi.",
        },
        { status: 500 },
      );
    }

    // clear auth cookies to require sign in after sign up
    await supabase.auth.signOut();
  }

  return NextResponse.json({
    ok: true,
    message:
      "Registration successful. Please check your email to verify your account.",
  });
}
